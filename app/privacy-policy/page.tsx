import LegalPage from "@/components/LegalPage";
import { getSiteConfig } from "@/lib/site-config";

export default async function PrivacyPolicyPage() {
  const config = await getSiteConfig();
  return <LegalPage page={config.legal.privacyPolicy} />;
}
