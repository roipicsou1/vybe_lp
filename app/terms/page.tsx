import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms — VYBE",
  description: "Terms for requesting early access to VYBE.",
};

export default function TermsPage() {
  return (
    <main className="legal">
      <p className="kicker">VYBE</p>
      <h1>Terms</h1>
      <p>
        These terms cover a request for early access on this website. They are not a guarantee of
        membership.
      </p>
      <h2>The request</h2>
      <p>
        You send your name, city, your role, what you are building, what you are looking for, and
        a way to reach you. VYBE reads applications individually. Access opens when a place in the
        circle is offered to you.
      </p>
      <h2>Your information</h2>
      <p>
        We use what you submit only to review your application and to contact you about VYBE. We do
        not sell it. You can ask for it to be deleted by writing to{" "}
        <a href="mailto:hello@joinvybe.app">hello@joinvybe.app</a>.
      </p>
      <h2>The product</h2>
      <p>
        VYBE is a private network for iPhone. Real meetings happen between people. VYBE is not
        responsible for what happens when two people decide to meet.
      </p>
      <p>
        <Link href="/">Back</Link>
        {" · "}
        <a href="https://roipicsou1.github.io/joinvybe/privacy-policy.html">Privacy</a>
      </p>
    </main>
  );
}
