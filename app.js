(function () {
  "use strict";

  const LINES_PER_PAGE = 24;
  const INK_MAP = {
    blue: "#1b4f9c",
    black: "#232220",
    red: "#a82828",
    green: "#1f6b43",
    purple: "#5c2d82"
  };

  const FONT_CONFIG = {
    casual: {
      className: "font-casual",
      canvasFont: '20px "ScribblyCasual", "Comic Sans MS", cursive',
      titleFont: 'bold 23px "ScribblyCasual", "Comic Sans MS", cursive'
    },
    neat: {
      className: "font-neat",
      canvasFont: '18.5px "ScribblyNeat", "Segoe Print", cursive',
      titleFont: 'bold 21px "ScribblyNeat", "Segoe Print", cursive'
    },
    classic: {
      className: "font-classic",
      canvasFont: 'italic 20.5px "ScribblyClassic", "Georgia", cursive',
      titleFont: 'italic bold 23px "ScribblyClassic", "Georgia", cursive'
    }
  };

  const SAMPLE_NOTES = `1. Overview of Cellular Respiration
Cellular respiration is the metabolic pathway through which cells convert biochemical energy from nutrients into adenosine triphosphate (ATP), releasing waste products along the way.

The overall balanced chemical equation is:
C6H12O6 + 6 O2  -->  6 CO2 + 6 H2O + Energy (ATP + Heat)

2. Stage One: Glycolysis (Cytoplasm)
- Occurs in the cytosol and does not require oxygen (anaerobic).
- One 6-carbon glucose molecule is split into two 3-carbon pyruvate molecules.
- Energy investment phase uses 2 ATP; energy payoff phase produces 4 ATP and 2 NADH.
- Net yield per glucose: 2 ATP, 2 NADH, and 2 Pyruvate.

3. Pyruvate Oxidation & The Citric Acid Cycle (Mitochondrial Matrix)
Before entering the Krebs cycle, each pyruvate is transported into the mitochondrial matrix and converted into Acetyl-CoA by pyruvate dehydrogenase, releasing one CO2 and generating one NADH.

During each turn of the Citric Acid Cycle:
- Acetyl-CoA (2C) joins oxaloacetate (4C) to form citrate (6C).
- Two carbons are released as carbon dioxide (CO2).
- Three NAD+ molecules are reduced to NADH, and one FAD is reduced to FADH2.
- One GTP (or ATP) is synthesized via substrate-level phosphorylation.

4. Stage Four: Oxidative Phosphorylation (Inner Mitochondrial Membrane)
Oxidative phosphorylation consists of two tightly coupled processes:
a) Electron Transport Chain (ETC): NADH and FADH2 donate high-energy electrons to protein complexes I-IV. As electrons move down the chain, protons (H+) are pumped from the matrix into the intermembrane space, creating an electrochemical proton gradient.
b) Chemiosmosis: Protons flow back into the matrix through ATP synthase, driving the phosphorylation of ADP into roughly 26 to 28 molecules of ATP. Oxygen serves as the final electron acceptor, combining with protons to form water (H2O).

5. Key Study Takeaways & Exam Reminders
- Total theoretical ATP yield per glucose molecule is approximately 30 to 32 ATP in eukaryotic cells.
- Without oxygen, cells switch to fermentation (lactic acid or alcoholic fermentation) to regenerate NAD+ so glycolysis can continue producing 2 ATP per glucose.
- Review diagrams of cristae folding and compare mitochondria with chloroplast thylakoid membranes before Friday's quiz!`;

  const state = {
    title: "Biology 101 — Cellular Respiration Notes",
    body: SAMPLE_NOTES,
    font: "casual",
    ink: "blue",
    paper: "lined",
    variation: 65,
    currentPage: 1,
    pages: [[]]
  };

  const el = {
    titleInput: document.getElementById("note-title"),
    bodyInput: document.getElementById("note-body"),
    fontSelect: document.getElementById("font-style"),
    paperSelect: document.getElementById("paper-style"),
    swatches: Array.from(document.querySelectorAll(".swatch")),
    variationSlider: document.getElementById("variation-level"),
    variationBadge: document.getElementById("variation-value"),
    wordCount: document.getElementById("word-count"),
    sheet: document.getElementById("notebook-sheet"),
    sheetTitle: document.getElementById("sheet-title-render"),
    sheetPageTag: document.getElementById("sheet-date-render"),
    sheetLines: document.getElementById("sheet-lines-container"),
    btnPrev: document.getElementById("btn-prev-page"),
    btnNext: document.getElementById("btn-next-page"),
    currentPageNum: document.getElementById("current-page-num"),
    totalPagesNum: document.getElementById("total-pages-num"),
    btnPng: document.getElementById("btn-export-png"),
    btnPdf: document.getElementById("btn-export-pdf"),
    btnSample: document.getElementById("btn-sample"),
    btnClear: document.getElementById("btn-clear"),
    sandbox: document.getElementById("measure-sandbox"),
    printContainer: document.getElementById("print-notebook-container")
  };

  function seededRandom(seed) {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function hashWord(str, index) {
    let h = 2166136261 ^ index;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function getWordVariation(word, globalWordIndex) {
    const intensity = state.variation / 100;
    if (intensity === 0) {
      return { y: 0, rotate: 0, scale: 1, spaceExtra: 0 };
    }
    const seed = hashWord(word, globalWordIndex);
    const r1 = seededRandom(seed + 1) - 0.5;
    const r2 = seededRandom(seed + 2) - 0.5;
    const r3 = seededRandom(seed + 3) - 0.5;
    const r4 = seededRandom(seed + 4) - 0.5;

    return {
      y: +(r1 * 2.4 * intensity).toFixed(2),
      rotate: +(r2 * 2.2 * intensity).toFixed(2),
      scale: +(1 + r3 * 0.05 * intensity).toFixed(3),
      spaceExtra: +(r4 * 2.2 * intensity).toFixed(2)
    };
  }

  function paginateText(rawText) {
    const fontCfg = FONT_CONFIG[state.font];
    el.sandbox.className = `measure-sandbox ${fontCfg.className}`;
    const maxLineWidth = el.sandbox.clientWidth || 566;

    const probe = document.createElement("span");
    probe.style.whiteSpace = "pre";
    el.sandbox.innerHTML = "";
    el.sandbox.appendChild(probe);

    const measureWidth = (text) => {
      probe.textContent = text;
      return probe.getBoundingClientRect().width;
    };

    const paragraphs = rawText.replace(/
/g, "
").split("
");
    const wrappedLines = [];

    for (const para of paragraphs) {
      if (para.trim() === "") {
        wrappedLines.push([]);
        continue;
      }

      const leadingMatch = para.match(/^(\s+)/);
      const leadingSpaces = leadingMatch ? leadingMatch[1] : "";
      const words = para.trim().split(/\s+/);

      let currentLineWords = [];
      let currentLineText = leadingSpaces;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const candidate =
          currentLineWords.length === 0
            ? leadingSpaces + word
            : currentLineText + " " + word;

        if (measureWidth(candidate) <= maxLineWidth || currentLineWords.length === 0) {
          currentLineWords.push({
            text: word,
            prefixSpace: currentLineWords.length === 0 ? leadingSpaces : " "
          });
          currentLineText = candidate;
        } else {
          wrappedLines.push(currentLineWords);
          currentLineWords = [{ text: word, prefixSpace: "" }];
          currentLineText = word;
        }
      }

      if (currentLineWords.length > 0) {
        wrappedLines.push(currentLineWords);
      }
    }

    if (wrappedLines.length === 0) {
      wrappedLines.push([]);
    }

    const pages = [];
    for (let i = 0; i < wrappedLines.length; i += LINES_PER_PAGE) {
      pages.push(wrappedLines.slice(i, i + LINES_PER_PAGE));
    }
    return pages;
  }

  function buildSheetDOM(targetSheet, pageLines, pageNumber, totalPages, startingWordIndex) {
    const fontCfg = FONT_CONFIG[state.font];
    targetSheet.className = `notebook-sheet paper-${state.paper} ink-${state.ink} ${fontCfg.className}`;

    const titleEl = targetSheet.querySelector(".sheet-title");
    const tagEl = targetSheet.querySelector(".sheet-page-tag");
    const linesContainer = targetSheet.querySelector(".sheet-lines");

    titleEl.textContent = state.title.trim() || "Untitled Study Notes";
    tagEl.textContent = `Page ${pageNumber} of ${totalPages}`;

    linesContainer.innerHTML = "";
    let wordCounter = startingWordIndex;

    pageLines.forEach((lineWords) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "notebook-line";

      if (lineWords.length === 0) {
        lineDiv.innerHTML = "&nbsp;";
      } else {
        lineWords.forEach((token) => {
          if (token.prefixSpace) {
            const spaceSpan = document.createElement("span");
            spaceSpan.textContent = token.prefixSpace;
            lineDiv.appendChild(spaceSpan);
          }

          const v = getWordVariation(token.text, wordCounter++);
          const wordSpan = document.createElement("span");
          wordSpan.className = "hw-word";
          wordSpan.textContent = token.text;
          wordSpan.style.transform = `translateY(${v.y}px) rotate(${v.rotate}deg) scale(${v.scale})`;
          if (v.spaceExtra !== 0) {
            wordSpan.style.marginRight = `${v.spaceExtra}px`;
          }
          lineDiv.appendChild(wordSpan);
        });
      }

      linesContainer.appendChild(lineDiv);
    });

    return wordCounter;
  }

  function render() {
    state.pages = paginateText(state.body);
    const totalPages = state.pages.length;

    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }
    if (state.currentPage < 1) {
      state.currentPage = 1;
    }

    let startWordIdx = 0;
    for (let p = 0; p < state.currentPage - 1; p++) {
      for (const line of state.pages[p]) {
        startWordIdx += line.length;
      }
    }

    buildSheetDOM(
      el.sheet,
      state.pages[state.currentPage - 1],
      state.currentPage,
      totalPages,
      startWordIdx
    );

    el.currentPageNum.textContent = String(state.currentPage);
    el.totalPagesNum.textContent = String(totalPages);
    el.btnPrev.disabled = state.currentPage <= 1;
    el.btnNext.disabled = state.currentPage >= totalPages;

    const trimmed = state.body.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    el.wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
  }

  function downloadCurrentPageAsPNG() {
    const scale = 2;
    const width = 680;
    const height = 920;
    const lineHeight = 32;
    const padTop = 36;
    const padLeft = 74;
    const padRight = 40;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    ctx.fillStyle = "#fffdf9";
    ctx.fillRect(0, 0, width, height);

    if (state.paper === "lined") {
      ctx.strokeStyle = "#c8d9e8";
      ctx.lineWidth = 1;
      for (let y = padTop + lineHeight * 2; y < height - 20; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
      ctx.strokeStyle = "#e3a3a3";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(58.5, 0);
      ctx.lineTo(58.5, height);
      ctx.stroke();
    } else if (state.paper === "grid") {
      ctx.strokeStyle = "#d8e3ec";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, padTop);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      for (let y = padTop; y <= height; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
    }

    const holeY = [99, 460, 821];
    holeY.forEach((cy) => {
      ctx.beginPath();
      ctx.arc(27, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#f5efe6";
      ctx.fill();
      ctx.strokeStyle = "#d5c7b6";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const inkColor = INK_MAP[state.ink] || INK_MAP.blue;
    const fontCfg = FONT_CONFIG[state.font];

    ctx.fillStyle = inkColor;
    ctx.font = fontCfg.titleFont;
    ctx.textBaseline = "alphabetic";

    const titleText = state.title.trim() || "Untitled Study Notes";
    ctx.fillText(titleText, padLeft, padTop + 54, width - padLeft - padRight - 95);

    ctx.font = fontCfg.canvasFont;
    ctx.globalAlpha = 0.8;
    const pageTag = `Page ${state.currentPage} of ${state.pages.length}`;
    const tagWidth = ctx.measureText(pageTag).width;
    ctx.fillText(pageTag, width - padRight - tagWidth, padTop + 54);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(140, 98, 57, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + 64);
    ctx.lineTo(width - padRight, padTop + 64);
    ctx.stroke();

    let wordCounter = 0;
    for (let p = 0; p < state.currentPage - 1; p++) {
      for (const line of state.pages[p]) {
        wordCounter += line.length;
      }
    }

    const pageLines = state.pages[state.currentPage - 1] || [];
    ctx.fillStyle = inkColor;

    pageLines.forEach((lineWords, lineIdx) => {
      const baselineY = padTop + lineHeight * (lineIdx + 3) - 8;
      let cursorX = padLeft;

      lineWords.forEach((token) => {
        ctx.font = fontCfg.canvasFont;
        if (token.prefixSpace) {
          cursorX += ctx.measureText(token.prefixSpace).width;
        }

        const v = getWordVariation(token.text, wordCounter++);
        const wordWidth = ctx.measureText(token.text).width;

        ctx.save();
        ctx.translate(cursorX + wordWidth / 2, baselineY + v.y);
        ctx.rotate((v.rotate * Math.PI) / 180);
        ctx.scale(v.scale, v.scale);
        ctx.fillText(token.text, -wordWidth / 2, 0);
        ctx.restore();

        cursorX += wordWidth + v.spaceExtra;
      });
    });

    const safeTitle = titleText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scribbly-note";
    const link = document.createElement("a");
    link.download = `${safeTitle}-page-${state.currentPage}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function exportCompleteNotebookPDF() {
    el.printContainer.innerHTML = "";
    let wordCounter = 0;
    const totalPages = state.pages.length;

    state.pages.forEach((pageLines, idx) => {
      const sheetClone = el.sheet.cloneNode(true);
      sheetClone.removeAttribute("id");
      wordCounter = buildSheetDOM(sheetClone, pageLines, idx + 1, totalPages, wordCounter);
      el.printContainer.appendChild(sheetClone);
    });

    const originalTitle = document.title;
    const safeTitle = (state.title.trim() || "Scribbly-Notes").replace(/[\/:*?"<>|]/g, "-");
    document.title = safeTitle;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 300);
  }

  el.titleInput.addEventListener("input", (e) => {
    state.title = e.target.value;
    render();
  });

  el.bodyInput.addEventListener("input", (e) => {
    state.body = e.target.value;
    render();
  });

  el.fontSelect.addEventListener("change", (e) => {
    state.font = e.target.value;
    render();
  });

  el.paperSelect.addEventListener("change", (e) => {
    state.paper = e.target.value;
    render();
  });

  el.swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.ink = btn.dataset.ink;
      el.swatches.forEach((s) => {
        const isActive = s === btn;
        s.classList.toggle("active", isActive);
        s.setAttribute("aria-checked", String(isActive));
      });
      render();
    });
  });

  el.variationSlider.addEventListener("input", (e) => {
    state.variation = Number(e.target.value);
    el.variationBadge.textContent = `${state.variation}%`;
    render();
  });

  el.btnPrev.addEventListener("click", () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      render();
    }
  });

  el.btnNext.addEventListener("click", () => {
    if (state.currentPage < state.pages.length) {
      state.currentPage++;
      render();
    }
  });

  el.btnPng.addEventListener("click", downloadCurrentPageAsPNG);
  el.btnPdf.addEventListener("click", exportCompleteNotebookPDF);

  el.btnSample.addEventListener("click", () => {
    state.title = "Biology 101 — Cellular Respiration Notes";
    state.body = SAMPLE_NOTES;
    state.currentPage = 1;
    el.titleInput.value = state.title;
    el.bodyInput.value = state.body;
    render();
  });

  el.btnClear.addEventListener("click", () => {
    state.title = "";
    state.body = "";
    state.currentPage = 1;
    el.titleInput.value = "";
    el.bodyInput.value = "";
    render();
  });

  el.bodyInput.value = state.body;
  render();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      render();
    });
  }
})();
