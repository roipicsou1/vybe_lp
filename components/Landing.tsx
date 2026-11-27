"use client";

import { FormEvent, useEffect, useRef, useState, type RefObject } from "react";
import { ambitions, journeys, roles, type FieldErrors, type LeadInput } from "@/lib/lead";

const PRIVACY = "https://roipicsou1.github.io/joinvybe/privacy-policy.html";

const questions = [
  { id: "journey", title: "What best describes you?" },
  { id: "role", title: "What’s your role?" },
  { id: "company", title: "What are you building?", note: "Optional" },
  { id: "ambitions", title: "What are you looking for on VYBE?", note: "Select all that apply." },
  { id: "name", title: "What’s your name?", autoComplete: "name" },
  { id: "city", title: "Which city are you in?", autoComplete: "address-level2", placeholder: "Geneva" },
  { id: "email", title: "What’s your email?", autoComplete: "email", type: "email", inputMode: "email" as const },
] as const;

type QuestionId = (typeof questions)[number]["id"];

const people = [
  { kind: "founders", title: "Founders & entrepreneurs", line: "Building what’s next." },
  { kind: "creators", title: "Creators & independents", line: "Creating on their own terms." },
  { kind: "investors", title: "Investors & business leaders", line: "Seeing opportunities before others do." },
  { kind: "aspiring", title: "Aspiring entrepreneurs", line: "Driven by what’s possible." },
] as const;

const activities = ["CO-WORKING", "SPORT", "DRINKS", "DINNER", "EVENT"] as const;

const empty: LeadInput = {
  name: "",
  firstName: "",
  lastName: "",
  city: "",
  journey: "",
  company: "",
  role: "",
  ambitions: [],
  email: "",
  linkedin: "",
  instagram: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  submissionId: "",
  website: "",
};

function attribution() {
  const params = new URLSearchParams(window.location.search);
  const read = (key: string) => params.get(key)?.trim() || "";
  return {
    utmSource: read("utm_source"),
    utmMedium: read("utm_medium"),
    utmCampaign: read("utm_campaign"),
    utmContent: read("utm_content"),
    utmTerm: read("utm_term"),
  };
}

export function Landing() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<LeadInput>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const applyRef = useRef<HTMLDialogElement>(null);
  const submissionId = useRef("");

  const [scrolled, setScrolled] = useState(false);

  function openApply() {
    const dialog = applyRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }

  // The nav is transparent over the hero and gets its dark glass background
  // once the page scrolls past it.
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    if (window.location.hash === "#access") openApply();
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      nodes.forEach((node) => node.classList.add("in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function set<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function toggleAmbition(id: string) {
    setValues((current) => {
      const has = current.ambitions.includes(id);
      return {
        ...current,
        ambitions: has ? current.ambitions.filter((item) => item !== id) : [...current.ambitions, id],
      };
    });
    setErrors((current) => ({ ...current, ambitions: undefined }));
  }

  function issuesFor(current: number): FieldErrors {
    const id = questions[current].id;
    const next: FieldErrors = {};
    if (id === "journey" && !values.journey) next.journey = "Choose what describes you.";
    if (id === "role" && !values.role) next.role = "Choose your role.";
    if (id === "ambitions" && values.ambitions.length === 0) next.ambitions = "Choose at least one.";
    if (id === "name" && values.name.trim().length < 2) next.name = "Add your name.";
    if (id === "city" && values.city.trim().length < 2) next.city = "Add your city.";
    if (id === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Enter a valid email.";
    }
    return next;
  }

  function go(nextIndex: number) {
    setStep(nextIndex);
    setErrors({});
  }

  function actionLabel() {
    if (pending) return "Sending…";
    if (step === questions.length - 1) return "Request early access";
    const question = questions[step];
    if ("note" in question && question.note === "Optional") {
      const value = values[question.id];
      if (typeof value === "string" && value.trim() === "") return "Skip";
    }
    return "Continue";
  }

  function nextStep() {
    const next = issuesFor(step);
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    go(Math.min(step + 1, questions.length - 1));
  }

  function choose(index: number, key: "journey" | "role", id: string) {
    set(key, id);
    window.setTimeout(() => {
      setStep((current) => (current === index ? index + 1 : current));
      setErrors({});
    }, 160);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    for (let index = 0; index < questions.length; index += 1) {
      const next = issuesFor(index);
      if (Object.keys(next).length > 0) {
        setErrors(next);
        go(index);
        return;
      }
    }
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    const payload = { ...values, ...attribution(), submissionId: submissionId.current };
    setPending(true);
    setErrors({});
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { ok?: boolean; errors?: FieldErrors };
      if (!response.ok || !data.ok) {
        const failed = data.errors ?? { form: "We couldn’t record your application. Try again." };
        setErrors(failed);
        const index = questions.findIndex((item) => failed[item.id]);
        if (index >= 0) go(index);
        return;
      }
      setDone(true);
    } catch {
      setErrors({ form: "We couldn’t record your application. Try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <header className={scrolled ? "nav scrolled" : "nav"}>
        <a className="brand" href="#top">
          <img src="/logo.png" alt="" />
          <span>VYBE</span>
        </a>
        <button className="nav-cta" type="button" onClick={openApply}>
          Request early access
        </button>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-brand">
            <img src="/logo.png" alt="" />
            <span>VYBE</span>
          </div>
          <h1>Where ambition connects.</h1>
          <p className="hero-lede">A private network for entrepreneurs and ambitious minds.</p>
          <button className="btn solid hero-cta" type="button" onClick={openApply}>
            Request early access
          </button>
          <div className="hero-phone" aria-hidden="true">
            <span className="side silent" />
            <span className="side vol" />
            <span className="side power" />
            <div className="phone-screen">
              <div className="island" />
              <p className="status">9:41</p>
              <div className="phone-map">
                <p>Nearby</p>
                <svg viewBox="0 0 280 560" preserveAspectRatio="xMidYMid slice" role="img">
                  <path d="M-20 120 C80 100, 140 170, 300 130" />
                  <path d="M-20 230 C70 210, 160 280, 300 240" />
                  <path d="M-20 350 C90 320, 170 400, 300 360" />
                  <path d="M-20 470 C80 440, 160 510, 300 480" />
                  <path d="M78 -20 C96 140, 48 300, 110 580" />
                  <path d="M196 -20 C168 160, 230 320, 176 580" />
                  <g className="pin" transform="translate(86 168)">
                    <circle r="6" />
                    <text y="-14">CO-WORKING</text>
                  </g>
                  <g className="pin" transform="translate(188 214)">
                    <circle r="6" />
                    <text y="-14">DRINKS</text>
                  </g>
                  <g className="pin" transform="translate(118 292)">
                    <circle r="7" />
                    <text y="24">SPORT</text>
                  </g>
                  <g className="pin" transform="translate(198 348)">
                    <circle r="5.5" />
                    <text y="-14">DINNER</text>
                  </g>
                  <g className="pin" transform="translate(96 410)">
                    <circle r="5.5" />
                    <text y="22">EVENT</text>
                  </g>
                </svg>
              </div>
              <span className="home-bar" />
            </div>
          </div>
        </section>

        <section className="experience reveal" id="experience">
          <div className="exp-head">
            <p className="kicker">The experience</p>
            <h2>More than a network.</h2>
          </div>
          <div className="bento">
            <article className="tile people-tile">
              <div className="device" aria-hidden="true">
                <div className="screen">
                  <div className="appbar"><span>Filters</span></div>
                  <div className="profile">
                    <p className="label">Building</p>
                    <div className="stage" />
                    <p className="distance">2 km</p>
                  </div>
                  <div className="decide">
                    <span>Pass</span>
                    <span>Connect</span>
                  </div>
                </div>
              </div>
              <div>
                <h3>Curated connections</h3>
                <p>Meet ambitious people who share your mindset, not just your industry.</p>
              </div>
            </article>
            <article className="tile map-tile">
              <p className="label">Nearby</p>
              <ul>
                {activities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>Real encounters</h3>
              <p>From a morning coffee to a workout or a business dinner. Take connections offline.</p>
              <p className="aside">Cowork, sport, drinks, dinner.</p>
            </article>
            <article className="tile inbox-tile">
              <div className="thread" aria-hidden="true">
                <span>Messages</span>
                <p>Say hello.</p>
                <small>Conversations appear when a connection is mutual, or when you join an activity.</small>
              </div>
              <h3>Shared ambition</h3>
              <p>Find your next co-founder, collaborator, mentor or simply someone who gets it.</p>
            </article>
          </div>
        </section>

        <section className="people reveal" id="people">
          <div className="people-head">
            <p className="kicker">The people</p>
            <h2>Different journeys. Same ambition.</h2>
          </div>
          <ul className="identities">
            {people.map((item) => (
              <li key={item.kind}>
                <Mark kind={item.kind} />
                <h3>{item.title}</h3>
                <p>{item.line}</p>
              </li>
            ))}
          </ul>
          <p className="people-close">
            <span>It’s not about where you are today.</span>
            <span>It’s about where you’re going.</span>
          </p>
          <button className="btn solid people-cta" type="button" onClick={openApply}>
            Request early access
          </button>
        </section>

        <section className="membership reveal" id="membership">
          <p className="kicker">Membership</p>
          <h2>Great circles are built intentionally.</h2>
          <ol className="journey">
            <li>
              <span>01</span>
              <h3>Apply</h3>
              <p>Tell us about yourself, what you do and what drives you.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Get reviewed</h3>
              <p>Every application is individually reviewed to preserve the quality of the network.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Join the circle</h3>
              <p>Once accepted, receive your personal invitation when access opens.</p>
            </li>
          </ol>
        </section>

        <section className="access reveal" id="access">
          <div className="access-panel">
            <h2>
              Surround yourself
              <br />
              with people who think bigger.
            </h2>
            <p className="intro">
              Tell us a little about you. We’re building the first circle of VYBE members, and we’d
              love to get to know you.
            </p>
            <button className="btn solid access-cta" type="button" onClick={openApply}>
              Request early access
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-row">
          <a className="brand" href="#top">
            <img src="/logo.png" alt="" />
            <span>VYBE</span>
          </a>
          <p>Coming exclusively to iOS.</p>
          <nav>
            <a href="mailto:hello@joinvybe.app">Contact</a>
            <a href={PRIVACY}>Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
        </div>
      </footer>

      <dialog className="apply" ref={applyRef} aria-labelledby="apply-title">
        <div className="apply-bar">
          <a className="brand" href="#top" onClick={() => applyRef.current?.close()}>
            <img src="/logo.png" alt="" />
            <span>VYBE</span>
          </a>
          <button className="apply-close" type="button" onClick={() => applyRef.current?.close()}>
            Close
          </button>
        </div>
        <div className="apply-body">
          <p className="kicker" id="apply-title">
            Early access
          </p>
          {done ? (
            <div className="success">
              <h3>You’re one step closer.</h3>
              <p>
                Your application has been received. We’ll be in touch as we build the first VYBE
                circle.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                if (step < questions.length - 1) {
                  event.preventDefault();
                  nextStep();
                  return;
                }
                void onSubmit(event);
              }}
              noValidate
            >
              <div className="progress" aria-hidden="true">
                {questions.map((item, index) => (
                  <span key={item.id} className={index <= step ? "on" : ""} />
                ))}
              </div>
              <p className="step-label">
                {step + 1} / {questions.length}
              </p>

              <div className="hp" aria-hidden="true">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(event) => set("website", event.target.value)}
                  />
                </label>
              </div>

              <Question
                key={questions[step].id}
                question={questions[step]}
                values={values}
                errors={errors}
                headingRef={headingRef}
                onChoose={choose}
                onText={(key, value) => set(key, value)}
                onAmbition={toggleAmbition}
              />

              {errors.form && <p className="form-error">{errors.form}</p>}

              <div className="actions">
                {step > 0 && (
                  <button type="button" className="back" onClick={() => go(step - 1)}>
                    Back
                  </button>
                )}
                <button className="primary" type="submit" disabled={pending}>
                  {actionLabel()}
                </button>
              </div>
              {step === questions.length - 1 && (
                <p className="fine">
                  By requesting access you agree to be contacted about your application.{" "}
                  <a href={PRIVACY}>Privacy</a>
                  {" · "}
                  <a href="/terms">Terms</a>
                </p>
              )}
            </form>
          )}
        </div>
      </dialog>
    </div>
  );
}

function Mark({ kind }: { kind: (typeof people)[number]["kind"] }) {
  if (kind === "founders") {
    return (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <path d="M80 28 L118 108 H42 Z" />
        <path d="M80 58 L104 108 H56 Z" />
        <path d="M80 84 L92 108 H68 Z" />
      </svg>
    );
  }
  if (kind === "creators") {
    return (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <path d="M24 108 C48 28, 112 28, 136 108" />
        <path d="M36 92 C58 40, 102 40, 124 92" />
        <path d="M52 78 C66 54, 94 54, 108 78" />
      </svg>
    );
  }
  if (kind === "investors") {
    return (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="46" />
        <circle cx="80" cy="80" r="24" />
        <path d="M80 22 V138 M22 80 H138" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <path d="M28 120 C48 120, 52 40, 132 36" />
      <circle cx="132" cy="36" r="5" />
      <path d="M28 120 H132" />
    </svg>
  );
}

function Question({
  question,
  values,
  errors,
  headingRef,
  onChoose,
  onText,
  onAmbition,
}: {
  question: (typeof questions)[number];
  values: LeadInput;
  errors: FieldErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onChoose: (index: number, key: "journey" | "role", id: string) => void;
  onText: (key: Exclude<QuestionId, "journey" | "role" | "ambitions">, value: string) => void;
  onAmbition: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const choices = question.id === "journey" || question.id === "role" || question.id === "ambitions";

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (choices) headingRef.current?.focus();
      else inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [choices, question.id, headingRef]);

  return (
    <div className="step-panel">
      <h3 id="ask" ref={headingRef} tabIndex={-1}>
        {question.title}
      </h3>
      {"note" in question && question.note ? <p className="ask-note">{question.note}</p> : null}

      {question.id === "journey" && (
        <div className="options" role="listbox" aria-labelledby="ask">
          {journeys.map((item) => (
            <button
              key={item.id}
              type="button"
              className="option"
              role="option"
              aria-selected={values.journey === item.id}
              aria-pressed={values.journey === item.id}
              onClick={() => onChoose(0, "journey", item.id)}
            >
              {item.label}
            </button>
          ))}
          {errors.journey && <p className="field-error">{errors.journey}</p>}
        </div>
      )}

      {question.id === "role" && (
        <div className="options" role="listbox" aria-labelledby="ask">
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              className="option"
              role="option"
              aria-selected={values.role === item.id}
              aria-pressed={values.role === item.id}
              onClick={() => onChoose(1, "role", item.id)}
            >
              {item.label}
            </button>
          ))}
          {errors.role && <p className="field-error">{errors.role}</p>}
        </div>
      )}

      {question.id === "ambitions" && (
        <div className="options" role="group" aria-labelledby="ask">
          {ambitions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="option"
              aria-pressed={values.ambitions.includes(item.id)}
              onClick={() => onAmbition(item.id)}
            >
              {item.label}
            </button>
          ))}
          {errors.ambitions && <p className="field-error">{errors.ambitions}</p>}
        </div>
      )}

      {question.id !== "journey" && question.id !== "role" && question.id !== "ambitions" && (
        <div className="ask">
          <input
            ref={inputRef}
            aria-labelledby="ask"
            type={"type" in question && question.type ? question.type : "text"}
            inputMode={"inputMode" in question ? question.inputMode : undefined}
            autoComplete={"autoComplete" in question ? question.autoComplete : "off"}
            placeholder={"placeholder" in question ? question.placeholder : undefined}
            value={values[question.id]}
            onChange={(event) => onText(question.id, event.target.value)}
          />
          {errors[question.id] && <p className="field-error">{errors[question.id]}</p>}
        </div>
      )}
    </div>
  );
}
