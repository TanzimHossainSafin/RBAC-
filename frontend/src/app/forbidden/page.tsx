import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="forbidden-page">
      <div className="panel forbidden-card">
        <span className="eyebrow">403</span>
        <h1>Permission required</h1>
        <p>This route is protected by a permission atom you do not currently hold.</p>
        <Link href="/" className="primary-button link-button">
          Return to login
        </Link>
      </div>
    </main>
  );
}
