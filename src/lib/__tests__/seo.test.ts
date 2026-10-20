import { describe, it, expect } from "vitest";
import {
  seoConfig,
  generateAlternates,
  generateOgMetadata,
  generateTwitterMetadata,
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  generatePageSeo,
} from "../seo";

describe("SEO Helpers & Metadata Generators", () => {
  it("should have clean base URL without trailing slash", () => {
    expect(seoConfig.siteUrl.endsWith("/")).toBe(false);
  });

  it("should generate canonical URLs properly without double slashes", () => {
    const alternatesRoot = generateAlternates("/");
    expect(alternatesRoot.canonical).toBe(seoConfig.siteUrl);

    const alternatesSub = generateAlternates("/about");
    expect(alternatesSub.canonical).toBe(`${seoConfig.siteUrl}/about`);

    const alternatesNoLeadingSlash = generateAlternates("contact");
    expect(alternatesNoLeadingSlash.canonical).toBe(`${seoConfig.siteUrl}/contact`);
  });

  it("should generate Open Graph metadata accurately", () => {
    const og = generateOgMetadata({
      title: "Test Page",
      description: "Test Description",
      locale: "id",
      pathname: "/test",
    });

    expect(og?.title).toBe("Test Page");
    expect(og?.description).toBe("Test Description");
    expect(og?.locale).toBe("id_ID");
    expect(og?.url).toBe(`${seoConfig.siteUrl}/test`);
  });

  it("should generate Twitter metadata accurately", () => {
    const twitter = generateTwitterMetadata({
      title: "Twitter Title",
      description: "Twitter Description",
    });

    if (twitter && "card" in twitter) {
      expect(twitter.card).toBe("summary_large_image");
      expect(twitter.title).toBe("Twitter Title");
    } else {
      throw new Error("Expected twitter card metadata to be defined");
    }
  });

  it("should generate valid JSON-LD objects for WebSite and Organization", () => {
    const websiteJsonLd = generateWebsiteJsonLd("id");
    expect(websiteJsonLd["@type"]).toBe("WebSite");
    expect(websiteJsonLd.inLanguage).toBe("id-ID");

    const orgJsonLd = generateOrganizationJsonLd();
    expect(orgJsonLd["@type"]).toBe("Organization");
    expect(orgJsonLd.name).toBe(seoConfig.siteName);
  });

  it("should construct full page SEO metadata with fallback defaults", () => {
    const metadata = generatePageSeo({
      title: "Dashboard",
      description: "User dashboard",
      locale: "en",
      pathname: "/dashboard",
    });

    expect(metadata.title).toBe(`Dashboard — ${seoConfig.siteName}`);
    expect(metadata.description).toBe("User dashboard");
    expect(metadata.metadataBase).toBeInstanceOf(URL);
  });
});
