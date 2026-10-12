import { PolicyContact, PolicyPage } from "@/components/layout/policy-page";

export const metadata = {
  title: "Privacy Policy",
  description: "How the Orderly portfolio demo handles account, sign-in and demonstration order information.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy">
      <section>
        <h2>About this demo</h2>
        <p>Orderly is a developer portfolio demonstration, not a real restaurant or commercial ordering service. Orders are demonstrations and do not result in food preparation, pickup or delivery. Although the service is a demo, information submitted to it can be stored in a live database. Use fictional order contact details and addresses, and do not submit sensitive information.</p>
      </section>
      <section>
        <h2>Information collected</h2>
        <p>Accounts contain your email address, name and optional phone number, account identifiers, sign-in methods and account timestamps. If you register with a password, a protected password representation is stored rather than the password itself. Session records and cookies support sign-in and sign-out.</p>
        <p>Demonstration orders contain the name, email, phone number, pickup or delivery choice, delivery address when supplied, notes, selected products and options, quantities, prices, order number, status and timestamps. Orders placed while signed in are linked to your account for private history. Guest orders are also stored.</p>
        <p>Requests involve technical information such as IP addresses, browser/request information and access times. The application uses request information to limit abuse, and hosting providers may process it in operational logs.</p>
      </section>
      <section>
        <h2>Google sign-in</h2>
        <p>When available and chosen by you, Google sign-in provides Orderly with a Google account identifier, verified email address and name when supplied. These are used to create or identify your Orderly account. Orderly does not receive your Google password or request access to Gmail, Google Drive or contacts. Google handles its own authentication under its policies.</p>
        <p>A matching email does not automatically connect Google to a password account. Connecting Google requires signing in to that account and confirming its current password. Orderly does not store Google provider access or refresh tokens after the sign-in flow.</p>
      </section>
      <section>
        <h2>How information is used and accessed</h2>
        <p>Information supports account access, profile updates, demonstration checkout, order history and tracking, administration, troubleshooting and abuse prevention. Administrators can view order details to demonstrate order management.</p>
        <p>Detailed tracking requires an order number and a private receipt code issued at checkout, or the signed-in account that placed the order. Receipt codes are reusable for 30 days unless revoked. Tracking does not display contact details, addresses or notes. Legacy guest orders and lost, expired or revoked codes cannot be recovered online. Private account history remains available through its owning account.</p>
      </section>
      <section>
        <h2>Cookies and browser storage</h2>
        <p>Cookies maintain sign-in sessions and the Google sign-in process. Local browser storage remembers your cart. Per-tab storage can retain checkout drafts and private receipt codes; browser session restoration may retain this tab data. Save your code somewhere private before leaving. Clearing or forgetting the tab receipt removes its local copy without revoking a saved code. Clearing browser data may sign you out; it does not delete database records. Signing out also does not delete your account or orders.</p>
        <p>The application code does not include advertising trackers or an analytics integration. Hosting providers may still process technical request data.</p>
      </section>
      <section>
        <h2>Service providers</h2>
        <p>The deployed demo uses Vercel for the website, Railway for the application server and Neon for database hosting. Google processes authentication when you choose Google sign-in. Processing or storage may take place outside your country; exact hosting locations and provider retention depend on the deployment and provider settings.</p>
        <p>An optional administrator-only menu writing tool sends product names, categories and supplied description text to OpenAI when enabled. Customer accounts and orders are not inputs to that tool. Administrators should not put personal information in menu text. Service providers handle information under their own terms and privacy policies.</p>
      </section>
      <section>
        <h2>Retention, choices and requests</h2>
        <p>No fixed account, order, backup or log retention period is promised for this demo. Session expiry is not the same as deletion of stored records. Demonstration data may be removed during maintenance or resets, and the service is not a permanent archive.</p>
        <p>You can browse without an account, choose password registration instead of Google, edit your account name and phone number, and clear browser storage. Self-service customer account deletion requires current-password or fresh Google identity verification and is blocked while orders are active. It removes your profile and sign-in credentials, signs out all customer sessions, erases personal contact/address/notes from your completed or cancelled account-owned orders, and revokes their receipt codes. Financial and item records are retained. Guest and other customers? records are unaffected; registering again does not recover deleted account history. There is no data export feature. Use the developer contact below to ask about your information, request access, correction or deletion, or raise a privacy concern. A request is not a guarantee of immediate or complete removal from backups or provider systems.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>This page may be updated as the demo or its data practices change. The date above identifies the latest revision.</p>
      </section>
      <PolicyContact />
    </PolicyPage>
  );
}
