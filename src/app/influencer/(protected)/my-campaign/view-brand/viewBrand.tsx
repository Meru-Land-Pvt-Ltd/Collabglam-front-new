"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  HiOutlineUserCircle,
  HiOutlineGlobeAlt,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { get } from "@/lib/api";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrandData {
  _id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  foundedDate?: string;
  location?: string;
  contactEmail?: string;
  phone?: string;
  country?: string;
  callingCode?: string;
  countryId?: string;
  callingId?: string;
  brandId?: string;
  createdAt?: string;
  socialLinks?: { platform: string; url: string }[];
  campaignCount?: number;
}

export default function ViewBrandProfilePage() {
  const params = useSearchParams();
  const id = params.get("id");
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No brand ID provided.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await get<BrandData>(`/brand?id=${id}`);
        setBrand(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load brand profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-pulse rounded-lg bg-gray-200 p-6 text-gray-500">Loading…</div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="rounded-lg bg-red-100 p-6 text-red-600">{error || "Brand not found."}</p>
      </div>
    );
  }

  const b = brand;

  return (
    <div className="min-h-full p-8 bg-gray-50 space-y-8">
      {/* Header with logo and name */}
      <div className="flex items-center space-x-6">
        {b.logoUrl && (
          <img
            src={b.logoUrl}
            alt={`${b.name} logo`}
            className="h-24 w-24 object-cover rounded-full border"
          />
        )}
        <div>
          <h1 className="text-4xl font-bold text-gray-800">{b.name}</h1>
          {b.industry && <Badge className="mt-1 bg-indigo-100 text-indigo-800">{b.industry}</Badge>}
        </div>
      </div>

      {/* Description */}
      {b.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{b.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Website */}
        {b.website && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlineGlobeAlt className="h-5 w-5 text-indigo-500" /> Website
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {new URL(b.website).hostname}
              </a>
            </CardContent>
          </Card>
        )}

        {/* Location */}
        {b.location && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlineLocationMarker className="h-5 w-5 text-indigo-500" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{b.location}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact Email */}
        {b.contactEmail && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlineMail className="h-5 w-5 text-indigo-500" /> Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href={`mailto:${b.contactEmail}`} className="text-indigo-600 hover:underline">
                {b.contactEmail}
              </a>
            </CardContent>
          </Card>
        )}

        {/* Phone */}
        {b.phone && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlinePhone className="h-5 w-5 text-indigo-500" /> Phone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{b.callingCode} {b.phone}</p>
            </CardContent>
          </Card>
        )}

        {/* Country */}
        {b.country && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlineLocationMarker className="h-5 w-5 text-indigo-500" /> Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{b.country}</p>
            </CardContent>
          </Card>
        )}

        {/* Founded Date */}
        {b.foundedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlineCalendar className="h-5 w-5 text-indigo-500" /> Founded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{new Date(b.foundedDate).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        )}

        {/* Created At */}
        {b.createdAt && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlineCalendar className="h-5 w-5 text-indigo-500" /> Profile Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{new Date(b.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        )}

        {/* IDs */}
        {b.countryId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Country ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 font-mono break-all">{b.countryId}</p>
            </CardContent>
          </Card>
        )}
        {b.callingId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calling ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 font-mono break-all">{b.callingId}</p>
            </CardContent>
          </Card>
        )}
        {b.brandId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brand ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 font-mono break-all">{b.brandId}</p>
            </CardContent>
          </Card>
        )}

        {/* Campaign count */}
        {b.campaignCount != null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HiOutlineBriefcase className="h-5 w-5 text-indigo-500" /> Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 font-semibold">{b.campaignCount}</p>
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {b.socialLinks && b.socialLinks.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Social Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {b.socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}