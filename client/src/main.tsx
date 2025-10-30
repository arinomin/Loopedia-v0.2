import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import SearchPage from './pages/search';

createRoot(document.getElementById("root")!).render(<App />);