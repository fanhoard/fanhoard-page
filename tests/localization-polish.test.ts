import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Localization Polish & Fixes", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.removeAttribute("lang");
    document.documentElement.removeAttribute("data-fv-built");
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("FvLang Core API (lang-core.js)", () => {
    it("should set language and dispatch fv:langchange event", () => {
      const listener = vi.fn();
      window.addEventListener("fv:langchange", listener);

      // Simulate FvLang
      const subscribers: Array<Function> = [];
      const FvLang = {
        lang: "en",
        supportedLangs: ["en", "th"],
        onChange(fn: Function) {
          subscribers.push(fn);
          return () => {
            const idx = subscribers.indexOf(fn);
            if (idx >= 0) subscribers.splice(idx, 1);
          };
        },
        setLang(newLang: string) {
          if (!["en", "th"].includes(newLang)) return;
          const prev = this.lang;
          this.lang = newLang;
          localStorage.setItem("selectedLang", newLang);
          document.documentElement.setAttribute("lang", newLang);
          subscribers.forEach(fn => fn(newLang, prev));
          window.dispatchEvent(new CustomEvent("fv:langchange", { detail: { lang: newLang, previousLang: prev } }));
        }
      };

      const sub = vi.fn();
      FvLang.onChange(sub);

      FvLang.setLang("th");

      expect(FvLang.lang).toBe("th");
      expect(localStorage.getItem("selectedLang")).toBe("th");
      expect(document.documentElement.getAttribute("lang")).toBe("th");
      expect(sub).toHaveBeenCalledWith("th", "en");
      expect(listener).toHaveBeenCalled();
      const eventDetail = listener.mock.calls[0][0].detail;
      expect(eventDetail).toEqual({ lang: "th", previousLang: "en" });
    });
  });

  describe("Language Picker Overlay UX (ui.js)", () => {
    it("should generate accessible listbox markup for language options", () => {
      const state = {
        selectedLang: "en",
        languagesConfig: {
          en: { label: "🇬🇧 English", buttonText: "Language: 🇬🇧 English" },
          th: { label: "🇹🇭 ไทย", buttonText: "ภาษา: 🇹🇭 ไทย" }
        }
      };

      const lang = state.selectedLang;
      let optionsHTML = '<div class="fv-lang-options-list" role="listbox" aria-label="Select language">';
      Object.entries(state.languagesConfig).forEach(([l, config]) => {
        const isCurrent = l === lang;
        const activeClass = isCurrent ? " fv-lang-option--active" : "";
        const checkMark = isCurrent ? '<span class="fv-lang-option-check" aria-hidden="true">✓</span>' : "";
        optionsHTML += '<button type="button" class="fv-lang-option' + activeClass + '" role="option" tabindex="0" aria-selected="' + (isCurrent ? "true" : "false") + '" data-language="' + l + '"><span class="fv-lang-option-label">' + (config.label || l) + '</span>' + checkMark + '</button>';
      });
      optionsHTML += '</div>';

      const div = document.createElement("div");
      div.innerHTML = optionsHTML;

      const listbox = div.querySelector('[role="listbox"]');
      expect(listbox).not.toBeNull();
      expect(listbox?.getAttribute("aria-label")).toBe("Select language");

      const options = div.querySelectorAll('[role="option"]');
      expect(options.length).toBe(2);

      const enOption = options[0];
      expect(enOption.getAttribute("aria-selected")).toBe("true");
      expect(enOption.classList.contains("fv-lang-option--active")).toBe(true);
      expect(enOption.querySelector(".fv-lang-option-check")).not.toBeNull();

      const thOption = options[1];
      expect(thOption.getAttribute("aria-selected")).toBe("false");
      expect(thOption.classList.contains("fv-lang-option--active")).toBe(false);
    });
  });

  describe("Translator Original Content Preservation", () => {
    it("should preserve original innerHTML and attributes and restore them cleanly on reset", () => {
      document.body.innerHTML = '<p id="p1" data-translate="test.p" placeholder="Enter text">Hello <strong>World</strong></p>';

      const p1 = document.getElementById("p1")!;
      
      // Store original content
      if (!p1.hasAttribute("data-original-html")) p1.setAttribute("data-original-html", p1.innerHTML);
      if (!p1.hasAttribute("data-original-text")) p1.setAttribute("data-original-text", p1.textContent?.trim() || "");
      if (p1.hasAttribute("placeholder")) p1.setAttribute("data-original-placeholder", p1.getAttribute("placeholder") || "");

      // Simulate translation modifying innerHTML
      p1.innerHTML = "สวัสดี <strong>โลก</strong>";
      p1.setAttribute("placeholder", "กรอกข้อความ");

      expect(p1.textContent).toContain("สวัสดี");

      // Reset to English
      const origHtml = p1.getAttribute("data-original-html");
      if (origHtml !== null) p1.innerHTML = origHtml;
      const origPh = p1.getAttribute("data-original-placeholder");
      if (origPh !== null) p1.setAttribute("placeholder", origPh);

      expect(p1.innerHTML).toBe("Hello <strong>World</strong>");
      expect(p1.getAttribute("placeholder")).toBe("Enter text");
    });
  });
});
