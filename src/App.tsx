import { Analytics } from "@vercel/analytics/react";
import OmbrelliHeistGame from "./OmbrelliHeistGame";

export default function App() {
  return (
    <>
      <OmbrelliHeistGame />
      <Analytics />
    </>
  );
}