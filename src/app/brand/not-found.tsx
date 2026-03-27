import NotFoundScreen from "@/components/common/not-found-screen";

export default function BrandNotFound() {
  return (
    <NotFoundScreen
      badge="Brand Area"
      title="Brand page not found"
      message="The brand page you’re trying to access doesn’t exist, may have been moved, or the link might be incorrect."
      primaryHref="/brand/dashboard"
      primaryLabel="Back to Brand Dashboard"
      secondaryHref="/"
      secondaryLabel="Go Home"
    />
  );
}