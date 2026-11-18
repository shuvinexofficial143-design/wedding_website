import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
export default function Login() {
  return (
    <section className="section auth-layout">
      <div className="auth-editorial">
        <Image
          src="/brand/wedding-editorial-small.webp"
          alt="Illustrative Indian wedding couple and royal invitation stationery"
          fill
          preload
          sizes="(max-width: 760px) 100vw, 45vw"
        />
        <div>
          <span className="eyebrow">SUHANI WEDDING STUDIO</span>
          <h2>
            Your celebration.
            <br />
            <i>Beautifully personal.</i>
          </h2>
          <p>
            Keep your invitations, wedding details and orders together in one
            private space.
          </p>
        </div>
      </div>
      <div className="auth-panel">
        <span className="eyebrow">YOUR CELEBRATION STARTS HERE</span>
        <h1>
          Welcome <i>back.</i>
        </h1>
        <p>Sign in or create an account to continue your invitation.</p>
        <AuthForm />
      </div>
    </section>
  );
}
