"use client";

import dynamic from "next/dynamic";

const BrandSignupClient = dynamic(() => import("./BrandSignupclient"), {
  ssr: false,
  loading: () => null, // or a small loader component
});

export default function BrandSignupNoSSR() {
  return <BrandSignupClient />;
}
