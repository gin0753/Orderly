import { PolicyContact, PolicyPage } from "@/components/layout/policy-page";

export const metadata = {
  title: "Terms of Service",
  description: "Conditions for exploring and using the Orderly portfolio demonstration.",
};

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service">
      <section>
        <h2>A portfolio demonstration</h2>
        <p>Orderly demonstrates website development, customer accounts and ordering workflows. It is not a real restaurant or commercial ordering service. Menu items, prices, availability, preparation estimates and order statuses are demonstration content. Placing an order does not create a purchase or arrange food preparation, pickup or delivery.</p>
        <p>The current demo does not collect card details or process payments. Do not send payment information or rely on an order confirmation as a real transaction.</p>
      </section>
      <section>
        <h2>Using the demo</h2>
        <p>You may explore the public menu, create your own account and submit demonstration orders. Use fictional order details and do not submit sensitive information, another person’s personal information or content you do not have permission to use. Google sign-in, when enabled, uses real Google identity information as described in the Privacy Policy.</p>
        <p>Keep your password and guest tracking details private. Use only accounts and orders you are authorized to access. Do not impersonate others, attempt unauthorized access, submit harmful content, or use automated traffic to disrupt the service.</p>
      </section>
      <section>
        <h2>Accounts and sign-in</h2>
        <p>Sign-in methods depend on configuration and your account. Google availability may change. Connecting Google to an existing password account requires that account’s current password and the matching Google email. A Google-only account does not currently support creating a password through the demo.</p>
        <p>Administrative functions are intended for authorized demonstration administrators. An account or submitted order does not grant access to those functions.</p>
      </section>
      <section>
        <h2>Availability and demonstration data</h2>
        <p>The demo is provided for evaluation without a promise of uninterrupted availability, support response times or permanent data storage. Features may be changed, disabled or removed. Accounts and demonstration orders may be cleared during maintenance or resets. Do not use the service as a record of real transactions or rely on it for an essential service.</p>
        <p>Menu descriptions, including optional AI-assisted drafts, are demonstration material and must not be relied upon for allergy, dietary or food safety decisions.</p>
      </section>
      <section>
        <h2>Privacy and third-party services</h2>
        <p>The Privacy Policy explains account, Google sign-in, order and browser-storage practices. Google and the infrastructure providers operate their services under their own terms. These terms do not promise the availability of any third-party service.</p>
      </section>
      <section>
        <h2>Changes and applicable rights</h2>
        <p>These terms may change as the demonstration evolves; the date above identifies the latest revision. Nothing here is intended to exclude rights that cannot be excluded under applicable law.</p>
      </section>
      <PolicyContact />
    </PolicyPage>
  );
}
