import { supabase } from '@/integrations/supabase/client';

export interface LicenseData {
  licenseName: string;
  licenseType: "Open Source" | "Research Only" | "Restricted";
  source: string;
  url: string;
  title?: string;
  commercialUse: "yes" | "no" | "conditional";
  modificationAllowed: boolean;
  redistributionAllowed: boolean;
  risks: string[];
  verdict: string;
  verdictType: "safe" | "warning" | "danger";
  licenses?: any[];
}

export interface ScanResult {
  success: boolean;
  data?: LicenseData;
  error?: string;
}

export interface ChatResult {
  success: boolean;
  response?: string;
  error?: string;
}

export async function scanLicense(url: string): Promise<ScanResult> {
  try {
    const { data, error } = await supabase.functions.invoke('scan-license', {
      body: { url },
    });

    if (error) {
      console.error('Scan license error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Scan license exception:', err);
    return { success: false, error: 'Failed to scan license' };
  }
}

export async function chatAboutLicense(
  message: string,
  licenseContext: Partial<LicenseData>
): Promise<ChatResult> {
  try {
    const { data, error } = await supabase.functions.invoke('license-chat', {
      body: { message, licenseContext },
    });

    if (error) {
      console.error('License chat error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('License chat exception:', err);
    return { success: false, error: 'Failed to chat about license' };
  }
}
