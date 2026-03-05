import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithAppProviders } from "./testUtils";

vi.mock("@/components/ui/select", async () => {
  const ReactModule = await import("react");
  const SelectContext = ReactModule.createContext(null);

  const Select = ({ value, onValueChange, disabled, children }) => (
    <SelectContext.Provider value={{ value, onValueChange, disabled }}>
      <div data-testid="mock-select">{children}</div>
    </SelectContext.Provider>
  );

  const SelectTrigger = ({ children, className, ...props }) => {
    const context = ReactModule.useContext(SelectContext);

    return (
      <button
        type="button"
        role="combobox"
        aria-expanded="true"
        disabled={context?.disabled}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  };

  const SelectValue = ({ placeholder }) => <span>{placeholder || "Select"}</span>;

  const SelectContent = ({ children }) => <div>{children}</div>;

  const SelectItem = ({ value, children }) => {
    const context = ReactModule.useContext(SelectContext);

    return (
      <button
        type="button"
        role="option"
        onClick={() => context?.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  };

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

import App from "../../src/App.jsx";

const sampleAppointmentTypes = [
  { id: 1, name: "Cleaning", duration_minutes: 60 },
  { id: 2, name: "Consultation", duration_minutes: 30 },
];

const sampleAvailability = {
  start: "2030-01-01",
  end: "2030-01-14",
  slots: [
    {
      date: "2030-01-10",
      start: "2030-01-10T14:00:00.000Z",
      end: "2030-01-10T15:00:00.000Z",
      time: "09:00",
      durationMinutes: 60,
    },
    {
      date: "2030-01-10",
      start: "2030-01-10T15:00:00.000Z",
      end: "2030-01-10T16:00:00.000Z",
      time: "10:00",
      durationMinutes: 60,
    },
  ],
};

const createJsonResponse = (body, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );

const chooseOptionByName = async (matcher) => {
  const option = await screen.findByRole("option", { name: matcher });
  fireEvent.click(option);
};

const chooseOptionByGlobalIndex = async (index) => {
  const options = await screen.findAllByRole("option");
  fireEvent.click(options[index]);
};

const originalFetch = global.fetch;

describe("UI: book appointment", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url, options = {}) => {
      const target = String(url);

      if (target.includes("/api/appointment-types")) {
        return createJsonResponse(sampleAppointmentTypes);
      }

      if (target.includes("/api/availability")) {
        return createJsonResponse(sampleAvailability);
      }

      if (target.includes("/api/appointments") && options.method === "POST") {
        return createJsonResponse({
          id: 700,
          startTime: "2030-01-10T14:00:00.000Z",
          endTime: "2030-01-10T15:00:00.000Z",
        }, 201);
      }

      return createJsonResponse({ message: "Not found" }, 404);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("loads services and renders selectable options", async () => {
    renderWithAppProviders(<App />, { initialEntries: ["/book-appointment"] });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/appointment-types"), undefined);
    });

    expect(await screen.findByRole("option", { name: /cleaning · 60 min/i })).toBeInTheDocument();
  });

  it("preselects appointment type from query param", async () => {
    renderWithAppProviders(<App />, { initialEntries: ["/book-appointment?appointmentTypeId=2"] });

    await waitFor(() => {
      const availabilityCall = global.fetch.mock.calls.find(([url]) =>
        String(url).includes("/api/availability") && String(url).includes("appointmentTypeId=2")
      );
      expect(availabilityCall).toBeTruthy();
    });
  });

  it("requires service/date/time before submit", async () => {
    renderWithAppProviders(<App />, { initialEntries: ["/book-appointment"] });

    fireEvent.change(await screen.findByLabelText(/first name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "(212) 555-5555" } });
    fireEvent.change(screen.getByLabelText(/additional notes/i), { target: { value: "Needs booking" } });

    const form = screen.getByRole("button", { name: /book appointment/i }).closest("form");
    fireEvent.submit(form);

    expect(await screen.findByText(/please select an appointment type/i)).toBeInTheDocument();
  });

  it("validates patient/contact/notes requirements", async () => {
    renderWithAppProviders(<App />, { initialEntries: ["/book-appointment"] });

    await chooseOptionByName(/cleaning · 60 min/i);
    await chooseOptionByName(/2030/i);
    await chooseOptionByGlobalIndex(3);

    fireEvent.change(await screen.findByLabelText(/last name/i), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "(212) 555-5555" } });
    fireEvent.change(screen.getByLabelText(/additional notes/i), { target: { value: "Needs booking" } });

    const form = screen.getByRole("button", { name: /book appointment/i }).closest("form");
    fireEvent.submit(form);

    expect(await screen.findByText(/please enter your first name/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/additional notes/i), { target: { value: "" } });

    fireEvent.submit(form);

    expect(await screen.findByText(/please add a short note/i)).toBeInTheDocument();
  });

  it("submits expected payload and shows success confirmation", async () => {
    renderWithAppProviders(<App />, { initialEntries: ["/book-appointment"] });

    await chooseOptionByName(/cleaning · 60 min/i);
    await chooseOptionByName(/2030/i);
    await chooseOptionByGlobalIndex(3);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "(212) 555-5555" } });
    fireEvent.change(screen.getByLabelText(/additional notes/i), { target: { value: "Looking for whitening consult" } });

    const form = screen.getByRole("button", { name: /book appointment/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      const postCall = global.fetch.mock.calls.find(
        ([url, options]) => String(url).includes("/api/appointments") && options?.method === "POST"
      );

      expect(postCall).toBeTruthy();
      const [, options] = postCall;
      const payload = JSON.parse(options.body);

      expect(payload).toMatchObject({
        firstName: "Ada",
        lastName: "Lovelace",
        contactEmail: "ada@example.com",
        contactPhone: "(212) 555-5555",
        notes: "Looking for whitening consult",
      });
      expect(typeof payload.appointmentTypeId).toBe("number");
      expect(payload.startTime).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /appointment requested/i })).toBeInTheDocument();
    });
  });
});
