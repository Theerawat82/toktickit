import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { checkSystem } from "./api.js";
export default function App() {
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    void categories;
    async function handleCheck() {
        setState("loading");
        try {
            const status = await checkSystem();
            if (status.online) {
                setState("success");
                setCategories(status.categories);
            }
        }
        catch (err) {
            setState("error");
        }
    }
    return (_jsxs("div", { className: "container py-5", style: { maxWidth: 640 }, children: [_jsxs("h1", { className: "h3 mb-4", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk" })] }), _jsx("button", { className: "btn btn-success", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), state === "error" && (_jsxs("div", { className: "alert alert-danger mt-4", children: [_jsx("strong", { children: "Offline:" }), " The backend API is currently unavailable. Please try again later."] })), state === "success" && (_jsxs("div", { className: "alert alert-success mt-4", children: [_jsx("strong", { children: "Online:" }), " Connected to TokTickIT API!"] }))] }));
}
