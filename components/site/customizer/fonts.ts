// The theme fonts the site doesn't load already, for the customizer's preview only (Geist and
// Geist Mono come from the root layout). Each sets the variable fontVar() in lib/theme.ts names,
// so the preview reads them exactly the way a project using the generated CSS would. Not
// preloaded: a font downloads when the preview first uses it.
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-ibm-plex-sans", display: "swap", preload: false });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap", preload: false });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  preload: false,
});

/** Classes that define the font variables; put them on an element around the customizer */
export const previewFontVariables = [inter, plexSans, sourceSerif, jetbrainsMono, plexMono].map((f) => f.variable).join(" ");
