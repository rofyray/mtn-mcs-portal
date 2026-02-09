import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <Image
          src="/brand/mtnlogoblack.png"
          alt="MTN Logo"
          width={120}
          height={60}
          priority
          className="not-found-logo"
        />
        <h1 className="not-found-code">404</h1>
        <p className="not-found-message">This page could not be found.</p>
        <Link href="/partner/login" className="btn btn-primary">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
