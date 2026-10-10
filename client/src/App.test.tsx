import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

describe("Saral Watch app shell", () => {
  beforeEach(() => localStorage.clear());

  it("renders the branded login screen for signed-out users", async () => {
    render(<MemoryRouter initialEntries={["/login"]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to the Saral Watch dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Incidents")).not.toBeInTheDocument();
    expect(screen.queryByText("Status Pages")).not.toBeInTheDocument();
  });
});
