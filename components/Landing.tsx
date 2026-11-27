"use client";

import { FormEvent, useEffect, useRef, useState, type RefObject } from "react";
import { ambitions, journeys, roles, type FieldErrors, type LeadInput } from "@/lib/lead";

const APP_STORE = "https://apps.apple.com/app/vybe-private-network/id6757075113";
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
  "Founders & entrepreneurs",
  "Creators & independents",
  "Investors & business leaders",
  "Aspiring entrepreneurs",
];

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const submissionId = useRef("");

  const [scrolled, setScrolled] = useState(false);

  // Pick the hero video that matches the screen shape (9:16 on tall screens,
  // 16:9 on wide ones) and swap it if the window is resized or rotated.
  // iOS only autoplays inline videos that are muted, so set that explicitly.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const wide = window.matchMedia("(min-aspect-ratio: 1/1)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const load = () => {
      const src = wide.matches ? "/hero/vybe-hero-desktop.mp4" : "/hero/vybe-hero-mobile.mp4";
      if (video.getAttribute("src") === src) return;
      video.src = src;
      if (!still.matches) video.play().catch(() => {});
    };
    load();
    wide.addEventListener("change", load);
    return () => wide.removeEventListener("change", load);
  }, []);

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
        <a className="nav-cta" href="#access">
          Request early access
        </a>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-media" aria-hidden="true">
            <video
              ref={videoRef}
              className="hero-video"
              muted
              loop
              playsInline
              preload="auto"
              poster="/hero/vybe-hero-poster.jpg"
            />
          </div>
          <img className="hero-logo" src="/logo.png" alt="" />
          <p className="hero-kicker">Private network</p>
          <h1>Vybe</h1>
          <p className="hero-lede">Where ambition connects.</p>
          <div className="hero-actions">
            <a className="btn ghost" href="#circle">
              Learn more
            </a>
            <a className="btn solid" href="#access">
              Request early access
            </a>
          </div>
          <a className="store" href={APP_STORE} target="_blank" rel="noreferrer" aria-label="Download on the App Store">
            <img src="/app-store.svg" alt="Download on the App Store" />
          </a>
        </section>

        <section className="section circle" id="circle">
          <p className="kicker">The circle</p>
          <div className="circle-layout">
            <h2>Surround yourself with people who think bigger.</h2>
            <p>
              VYBE brings together ambitious founders, entrepreneurs and builders who share the same
              drive. Discover like-minded people in your city, exchange ideas and build meaningful
              connections beyond the screen.
            </p>
          </div>
        </section>

        <section className="section" id="experience">
          <p className="kicker">The experience</p>
          <h2>More than a network.</h2>
          <div className="experience">
            <article>
              <span>01</span>
              <div>
                <h3>Curated connections</h3>
                <p>Meet ambitious people who share your mindset, not just your industry.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Real encounters</h3>
                <p>From a morning coffee to a workout or a business dinner. Take connections offline.</p>
                <p className="aside">Cowork, sport, drinks, dinner.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Shared ambition</h3>
                <p>Find your next co-founder, collaborator, mentor or simply someone who gets it.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="section" id="people">
          <p className="kicker">The people</p>
          <h2>Different journeys. Same ambition.</h2>
          <ul className="roster">
            {people.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p className="people-close">
            It’s not about where you are today. It’s about where you’re going.
          </p>
          <a className="text-cta" href="#access">
            Request early access
          </a>
        </section>

        <section className="section membership" id="membership">
          <p className="kicker">Membership</p>
          <h2>Great circles are built intentionally.</h2>
          <ol className="journey">
            <li>
              <span>01</span>
              <div>
                <h3>Apply</h3>
                <p>Tell us about yourself, what you do and what drives you.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Get reviewed</h3>
                <p>Every application is individually reviewed to preserve the quality of the network.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Join the circle</h3>
                <p>Once accepted, receive your personal invitation when access opens.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="access" id="access">
          <h2>Your next connection starts here.</h2>
          <p className="intro">
            Tell us a little about yourself. We’re building the first circle of VYBE members, and
            we’d love to get to know you.
          </p>
          <div className="card">
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
                  <span className="step-count">
                    {step + 1} / {questions.length}
                  </span>
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
        </section>
      </main>

      <footer className="footer">
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
      </footer>
    </div>
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
