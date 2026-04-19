import { SpeedInsights } from "@vercel/speed-insights/react";
import OmbrelliHeistGame from "./OmbrelliHeistGame";

export default function App() {
  return (
    <>
      <OmbrelliHeistGame />
      <SpeedInsights />
    </>
  );
}