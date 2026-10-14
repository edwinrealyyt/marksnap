/* ===================================================================
   MarkSnap - app.js
   Markdown → Image conversion application logic
   =================================================================== */

(function () {
  'use strict';

  // ─── DOM References ───────────────────────────────────────────────
  var editor = document.getElementById('editor');
  var captureWrapper = document.getElementById('capture-wrapper');
  var captureContent = document.getElementById('capture-content');
  var watermarkEl = document.getElementById('watermark');

  var btnDownload = document.getElementById('btn-download');
  var btnCopy = document.getElementById('btn-copy');
  var btnSample = document.getElementById('btn-sample');
  var btnPaste = document.getElementById('btn-paste');
  var btnClear = document.getElementById('btn-clear');
  var btnLoadFile = document.getElementById('btn-load-file');
  var fileInput = document.getElementById('file-input');

  var themeSelector = document.getElementById('theme-selector');

  var settingWidth = document.getElementById('setting-width');
  var settingWidthValue = document.getElementById('setting-width-value');
  var settingPadding = document.getElementById('setting-padding');
  var settingPaddingValue = document.getElementById('setting-padding-value');
  var settingFontSize = document.getElementById('setting-font-size');
  var settingFontSizeValue = document.getElementById('setting-font-size-value');
  var settingScale = document.getElementById('setting-scale');
  var settingWatermark = document.getElementById('setting-watermark');

  var charCount = document.getElementById('char-count');
  var lineCount = document.getElementById('line-count');

  var resizeHandle = document.getElementById('resize-handle');
  var editorPanel = document.getElementById('editor-panel');

  var hljsThemeDark = document.getElementById('hljs-theme-dark');
  var hljsThemeLight = document.getElementById('hljs-theme-light');

  var loadingOverlay = document.getElementById('loading-overlay');
  var toastEl = document.getElementById('toast');

  // ─── State ────────────────────────────────────────────────────────
  var currentTheme = 'light';
  var toastTimer = null;

  // ─── Marked Configuration ────────────────────────────────────────
  // Use safe, version-agnostic setup. Code highlighting done POST-render.
  try {
    if (typeof marked !== 'undefined') {
      if (typeof marked.setOptions === 'function') {
        marked.setOptions({ breaks: true, gfm: true });
      }
    }
  } catch (e) {
    console.warn('marked config error:', e);
  }

  // ─── Sample Markdown (Comprehensive Feature Test) ─────────────────
  var SAMPLE_MD = [
    '# 🚀 MarkSnap 全特性测试文档 (H1)',
    '',
    '本示例文本涵盖 **Markdown 全部核心语法与排版扩展特性**，便于全面测试卡片视觉、代码高亮、数学公式及特殊排版自愈能力。',
    '',
    '## 1. 标题层级测试 (Headings H2 ~ H6)',
    '',
    '### 1.1 三级标题 (H3 Heading)',
    '#### 1.2 四级标题 (H4 Heading)',
    '##### 1.3 五级标题 (H5 Heading)',
    '###### 1.4 六级标题 (H6 Heading)',
    '',
    '---',
    '',
    '## 2. 文本行内样式 (Inline Formatting)',
    '',
    '- **加粗文本** (`**粗体**` 或 `__粗体__`)',
    '- *斜体文本* (`*斜体*` 或 `_斜体_`)',
    '- ***粗斜体结合*** (`***粗斜体***`)',
    '- ~~删除线效果~~ (`~~删除线~~`)',
    '- 文本高亮标记：<mark>重点突出标注</mark> (`<mark>高亮</mark>`)',
    '- 行内等宽代码：`const timestamp = Date.now();`',
    '- 键盘按键徽标：<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>',
    '- 上标与下标：`H`<sub>2</sub>`O`（水分子），`2`<sup>10</sup> = 1024',
    '- 中文标点与代码混合兼容测试：**`config.json`**，以及 *`options`* 参数解析正常闭合。',
    '',
    '---',
    '',
    '## 3. 引用块 (Blockquotes)',
    '',
    '> 💡 **技术卡片生成器**：MarkSnap 可将任意 Markdown 文档或 AI 对话一键转为高颜值截图。',
    '> 所有渲染与图片生成均在本地浏览器内完成，无需上传服务器，保护隐私。',
    '',
    '> 一级引用嵌套测试',
    '> > 二级嵌套引用：展示边框层级与文字深度',
    '> > > 三级深度引用：依然支持行内代码 `console.log()` 与格式',
    '',
    '---',
    '',
    '## 4. 丰富列表 (Lists)',
    '',
    '### 4.1 无序列表与多层级嵌套',
    '- 🎨 **多主题体系**',
    '  - 经典质感：亮色白、暗色黑、GitHub 原生风',
    '  - 潮流渐变卡片：',
    '    - 蓝紫渐变（优雅深邃）',
    '    - 日落渐变（温暖活力）',
    '    - 翠绿渐变（清新护眼）',
    '- 📐 **精细化控制**：自由微调导出宽度、卡片内边距、字体大小与导出倍率',
    '',
    '### 4.2 有序列表 (流程操作)',
    '1. **输入内容**：在左侧编辑器中直接输入或粘贴 Markdown 格式文本',
    '2. **调节设置**：在顶部控制栏挑选喜爱的主题与布局尺寸',
    '   1. 自由开启或关闭底部水印标识',
    '   2. 选择导出倍率（推荐 2x 高清模式）',
    '3. **一键导出**：点击「下载 PNG」保存高清图，或点击「复制图片」直达系统剪贴板',
    '',
    '### 4.3 任务清单 (Task Lists)',
    '- [x] 完整 CommonMark / GFM 基础排版兼容',
    '- [x] KaTeX 高性能 LaTeX 数学公式渲染引擎',
    '- [x] 多语言代码高亮与 macOS 拟物窗口红黄绿圆点',
    '- [x] 智能自愈 AI 输出的错乱/断行表格',
    '- [ ] 自定义个性化水印文字配置（规划中）',
    '',
    '---',
    '',
    '## 5. 表格渲染 (Tables)',
    '',
    '### 5.1 标准 GFM 对齐表格',
    '| 特性模块 (左对齐) | 解析引擎 (居中) | 支持规格 (右对齐) | 运行状态 (居中) |',
    '| :--- | :---: | ---: | :---: |',
    '| GFM 核心语法 | Marked.js v4 | 100% 规范兼容 | 🟢 正常 |',
    '| 语法高亮引擎 | Highlight.js | 190+ 编程语言 | 🟢 正常 |',
    '| LaTeX 数学公式 | KaTeX 原生加速 | 零外部依赖秒开 | 🟢 正常 |',
    '| 高清卡片导出 | html2canvas | 1x / 2x / 3x 超清 | 🟢 正常 |',
    '',
    '### 5.2 AI 错乱表格自愈测试（带 `<br>` 换行单元格）',
    '| 模型维度 | GPT-4o | Gemini 1.5 Pro<br>',
    '<br>*Google 出品* | Claude 3.5 Sonnet |',
    '| --- | --- | --- | --- |',
    '| **上下文窗口** | **128K tokens**<br>',
    '<br>（约 10 万字）| **100 万 tokens**<br>',
    '<br>（业界最长，超大文档分析）| **200K tokens** |',
    '| **代码能力** | **极强**<br>',
    '<br>插件生态丰富，支持代码执行 | **较强**<br>',
    '<br>深度集成 Google 工具链 | **顶尖**<br>',
    '<br>公认逻辑与代码推理最佳 |',
    '| **多模态能力** | ✅ 图像 / 音频 / 视频 | ✅ 全模态深度解析 | ✅ 顶尖视觉理解 |',
    '',
    '---',
    '',
    '## 6. 代码块与语法高亮 (Code Blocks)',
    '',
    '### 6.1 JavaScript 异步剪贴板操作',
    '```javascript',
    '// 异步将 Canvas 画面写入系统剪贴板',
    'async function copyCanvasToClipboard(canvas) {',
    '  const blob = await new Promise(resolve => canvas.toBlob(resolve, \'image/png\'));',
    '  await navigator.clipboard.write([',
    '    new ClipboardItem({ [blob.type]: blob })',
    '  ]);',
    '  return { success: true, timestamp: Date.now() };',
    '}',
    '```',
    '',
    '### 6.2 Python 经典快速排序',
    '```python',
    'def quick_sort(arr: list[int]) -> list[int]:',
    '    """经典快速排序算法"""',
    '    if len(arr) <= 1:',
    '        return arr',
    '    pivot = arr[len(arr) // 2]',
    '    left = [x for x in arr if x < pivot]',
    '    middle = [x for x in arr if x == pivot]',
    '    right = [x for x in arr if x > pivot]',
    '    return quick_sort(left) + middle + quick_sort(right)',
    '',
    'print(quick_sort([3, 6, 8, 10, 1, 2, 1]))',
    '# [1, 1, 2, 3, 6, 8, 10]',
    '```',
    '',
    '### 6.3 Shell / 终端命令',
    '```bash',
    '# 启动本地开发预览服务器',
    'npx serve . -p 8080',
    '```',
    '',
    '### 6.4 JSON 配置结构',
    '```json',
    '{',
    '  "name": "marksnap",',
    '  "theme": "gradient-blue",',
    '  "scale": 2,',
    '  "watermark": true',
    '}',
    '```',
    '',
    '---',
    '',
    '## 7. 数学公式排版 (KaTeX LaTeX)',
    '',
    '### 7.1 行内公式 (Inline Math)',
    '爱因斯坦质能方程为 $E = mc^2$，高斯正态分布密度函数为 $f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$。',
    '',
    '### 7.2 独立块级公式 (Display Math)',
    '欧拉恒等式与高斯积分方程：',
    '$$',
    'e^{i\\pi} + 1 = 0 \\quad \\text{且} \\quad \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
    '$$',
    '',
    '二维平面坐标旋转变换矩阵：',
    '$$',
    '\\begin{pmatrix}',
    '\\cos\\theta & -\\sin\\theta \\\\',
    '\\sin\\theta & \\cos\\theta',
    '\\end{pmatrix}',
    '\\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} x\' \\\\ y\' \\end{pmatrix}',
    '$$',
    '',
    '---',
    '',
    '## 8. 链接、多媒体与折叠卡片 (Rich Components)',
    '',
    '- **超链接测试**：[访问 MarkSnap 项目主页](https://github.com) 或自动转链 <https://github.com>',
    '- **内嵌矢量图标**：',
    '',
    '  ![SVG 图标](data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="48" viewBox="0 0 320 48"><rect width="320" height="48" rx="8" fill="%236366f1"/><text x="160" y="29" fill="%23fff" font-size="14" font-family="sans-serif" font-weight="600" text-anchor="middle">🎨 MarkSnap 优雅视觉排版引擎</text></svg>)',
    '',
    '<details>',
    '<summary><b>🔍 点击展开查看使用秘籍 (Tips & FAQ)</b></summary>',
    '',
    '1. **快捷键缩进**：在编辑器中按 <kbd>Tab</kbd> 可快速插入 2 个空格缩进。',
    '2. **文件拖放**：直接将电脑中的 `.md` 文件拖入左侧输入框即可快速读取。',
    '3. **最佳画质**：导出图片用于社交平台或技术社区分享时，建议选择 **2x** 或 **3x** 高清模式。',
    '</details>',
    '',
    '---',
    '',
    '*由 MarkSnap 强力驱动 · 让技术分享更优雅*'
  ].join('\n');

  // ─── Initialize ──────────────────────────────────────────────────
  function init() {
    editor.value = SAMPLE_MD;
    applyTheme('light');
    renderPreview();
    bindEvents();
    updateStats();
  }

  // ─── Event Bindings ──────────────────────────────────────────────
  function bindEvents() {
    var renderTimeout;
    editor.addEventListener('input', function () {
      clearTimeout(renderTimeout);
      renderTimeout = setTimeout(function () {
        renderPreview();
        updateStats();
      }, 150);
    });

    themeSelector.addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-btn');
      if (!btn) return;
      applyTheme(btn.dataset.theme);
    });

    settingWidth.addEventListener('input', function () {
      var val = settingWidth.value;
      settingWidthValue.textContent = val + 'px';
      captureWrapper.style.width = val + 'px';
    });

    settingPadding.addEventListener('input', function () {
      var val = settingPadding.value;
      settingPaddingValue.textContent = val + 'px';
      applyPadding(parseInt(val));
    });

    settingFontSize.addEventListener('input', function () {
      var val = settingFontSize.value;
      settingFontSizeValue.textContent = val + 'px';
      captureContent.style.fontSize = val + 'px';
    });

    settingWatermark.addEventListener('change', function () {
      watermarkEl.classList.toggle('hidden', !settingWatermark.checked);
    });

    btnDownload.addEventListener('click', downloadImage);
    btnCopy.addEventListener('click', copyImageToClipboard);

    if (btnSample) {
      btnSample.addEventListener('click', function () {
        editor.value = SAMPLE_MD;
        renderPreview();
        updateStats();
        showToast('已加载全特性测试示例文本', 'success');
      });
    }

    btnPaste.addEventListener('click', function () {
      navigator.clipboard.readText().then(function (text) {
        editor.value = text;
        renderPreview();
        updateStats();
        showToast('已从剪贴板粘贴', 'success');
      }).catch(function () {
        showToast('无法读取剪贴板，请手动粘贴', 'error');
      });
    });

    btnClear.addEventListener('click', function () {
      editor.value = '';
      renderPreview();
      updateStats();
    });

    btnLoadFile.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', handleFileLoad);

    editor.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      editor.style.borderColor = 'var(--accent-primary)';
    });
    editor.addEventListener('dragleave', function () {
      editor.style.borderColor = '';
    });
    editor.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      editor.style.borderColor = '';
      var file = e.dataTransfer.files[0];
      if (file) loadFileContent(file);
    });

    bindResizeHandle();

    editor.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var start = editor.selectionStart;
        var end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
        renderPreview();
      }
    });
  }

  // ─── Preprocess Markdown ─────────────────────────────────────────
  // Handles AI-generated Markdown quirks, especially Gemini's broken table format.
  //
  // Gemini splits table cells across multiple lines using literal <br> tags:
  //
  //   | Header A | Header B <br>
  //   <br>extra text | Header C |
  //   | --- | --- | --- |
  //   | **Cell**<br>
  //   <br>(extra info) | other cell |
  //
  // Phase 1: Join continuation lines back into single table rows
  // Phase 2: Strip <br> tags (replace with space)
  // Phase 3: Normalize separator rows
  // Phase 4: Trim cell whitespace
  function preprocessMarkdown(md) {
    if (!md) return '';

    // ── Phase 0: Normalize AI-generated / imperfect Markdown syntax ──
    // 1. Normalize spaced/imperfect stars around inline code (single-line only, no \n)
    md = md.replace(/(^|[^\*])\*\*?[ \t]*(`[^`\n]+`)[ \t]*\*?\*(?=[^\*]|$)/g, '$1**$2**');

    // 2. Convert bold/italic code to explicit HTML tags ("**`code`**" -> "<strong>`code`</strong>")
    // Fixes marked.js CJK punctuation delimiter bug where trailing Chinese punctuation (，。！？) breaks closing stars
    md = md.replace(/\*\*(`[^`\n]+`)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/(^|[^\*])\*(`[^`\n]+`)\*(?=[^\*]|$)/g, '$1<em>$2</em>');

    // 3. Fix spaced bold/italic text on the same line
    md = md.replace(/(^|[^\*])\*\*[ \t]+([^\*\s\n](?:[^\*\n]*?[^\*\s\n])?)[ \t]+\*\*(?=[^\*]|$)/g, '$1**$2**');
    md = md.replace(/(^|[^\*])\*[ \t]+([^\*\s\n](?:[^\*\n]*?[^\*\s\n])?)[ \t]+\*(?=[^\*]|$)/g, '$1*$2*');

    // ── Phase 1: Join br-split continuation lines ─────────────────
    var rawLines = md.split('\n');
    var joined = [];

    for (var i = 0; i < rawLines.length; i++) {
      var line = rawLines[i];
      var trimmed = line.trim();

      var prevIdx = joined.length - 1;
      var hasPrev = joined.length > 0;
      var prevLine = hasPrev ? joined[prevIdx] : '';
      var prevHasPipe = hasPrev && prevLine.indexOf('|') !== -1;

      // Case 1: previous table line ends with <br> — current is a continuation
      if (prevHasPipe && /<br\s*\/?>\s*$/i.test(prevLine)) {
        joined[prevIdx] = prevLine + ' ' + trimmed;
        continue;
      }

      // Case 2: current line starts with <br> and previous is a table line
      if (prevHasPipe && /^<br\s*\/?>/i.test(trimmed)) {
        joined[prevIdx] = prevLine + ' ' + trimmed;
        continue;
      }

      // Case 3: continuation line with no pipe, after a br-containing table line
      if (
        prevHasPipe &&
        trimmed !== '' &&
        trimmed.indexOf('|') === -1 &&
        !/^#{1,6}\s/.test(trimmed) &&
        !/^[-*+]\s/.test(trimmed) &&
        !/^>\s/.test(trimmed) &&
        !/^```/.test(trimmed) &&
        /<br\s*\/?>/i.test(prevLine)
      ) {
        joined[prevIdx] = prevLine + ' ' + trimmed;
        continue;
      }

      joined.push(line);
    }

    // ── Phase 2-4: Clean each line ────────────────────────────────
    var result = [];

    for (var j = 0; j < joined.length; j++) {
      var ln = joined[j];
      var tr = ln.trim();
      var isTableRow = tr.charAt(0) === '|' || /^[^\n]+\|/.test(tr);

      if (isTableRow) {
        // Phase 2: Remove all <br> tags, replace with space
        ln = ln.replace(/<br\s*\/?>/gi, ' ');

        // Phase 3: Detect & normalize separator rows (preserving column alignments)
        var stripped = ln.replace(/\s/g, '');
        // A separator row looks like: |---|---| or |:---|:---:| etc.
        if (/^\|?([-:]+\|)+[-:]*$/.test(stripped)) {
          var cells = ln.split('|');
          if (cells.length > 2) {
            var parts = [];
            for (var k = 1; k < cells.length - 1; k++) {
              var tc = cells[k].replace(/\s/g, '');
              var left = tc.charAt(0) === ':';
              var right = tc.charAt(tc.length - 1) === ':';
              if (left && right) {
                parts.push(':---:');
              } else if (right) {
                parts.push('---:');
              } else if (left) {
                parts.push(':---');
              } else {
                parts.push('---');
              }
            }
            ln = '| ' + parts.join(' | ') + ' |';
          }
        }

        // Phase 4: Collapse multiple spaces, trim each cell
        ln = ln.replace(/\s+/g, ' ');
        ln = ln.replace(/\|\s*([^|]*?)\s*(?=\|)/g, function (_, cell) {
          return '| ' + cell.trim() + ' ';
        });
      }

      result.push(ln);
    }

    return result.join('\n');
  }

  // ─── Math & Code Placeholder Extraction ──────────────────────────
  // Extract fenced code, inline code, and LaTeX math ($...$, $$...$$, \(...\), \[...\])
  // BEFORE marked.js runs so backslashes (\%, \times, \\), underscores, and asterisks
  // inside formulas are never mangled by Markdown parsing.
  function extractMathAndPreprocess(md) {
    var mathStore = [];
    var codeStore = [];

    function saveCode(match) {
      var id = codeStore.length;
      codeStore.push(match);
      return 'MARKSNAPCODE' + id + 'END';
    }

    function saveMath(tex, display) {
      var id = mathStore.length;
      mathStore.push({ tex: tex.trim(), display: !!display });
      return 'MARKSNAPMATH' + id + 'END';
    }

    // 1. Protect fenced code blocks (```...``` or ~~~...~~~)
    //    Wait: if the language is ```math or ```latex, render it as display math!
    md = md.replace(/(^|\n)([ \t]*)(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n[ \t]*\3[ \t]*(?=\n|$)/g, function (match, lead, indent, fence, info, body) {
      var lang = (info || '').trim().toLowerCase();
      if (lang === 'math' || lang === 'latex' || lang === 'katex') {
        return lead + indent + saveMath(body, true);
      }
      return lead + saveCode(indent + fence + info + '\n' + body + '\n' + indent + fence);
    });

    // 2. Protect inline code spans (`...`)
    md = md.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, function (match) {
      return saveCode(match);
    });

    // 3. Extract display math: $$ ... $$ (single-line or multi-line)
    md = md.replace(/(^|[^\\])\$\$((?:\\.|[^$]|(?:\$(?!\$)))+?)\$\$/g, function (_, prefix, tex) {
      return prefix + saveMath(tex, true);
    });

    // 4. Extract display math: \[ ... \]
    md = md.replace(/\\\[([\s\S]+?)\\\]/g, function (_, tex) {
      return saveMath(tex, true);
    });

    // 5. Extract inline math: \( ... \)
    md = md.replace(/\\\(([\s\S]+?)\\\)/g, function (_, tex) {
      return saveMath(tex, false);
    });

    // 6. Extract inline math: $ ... $ (single-line, no leading/trailing spaces inside $)
    md = md.replace(/(^|[^\\$])\$((?:\\.|[^$\n])+?)\$(?!\$|\d)/g, function (match, prefix, tex) {
      if (/^\s|\s$/.test(tex)) return match;
      return prefix + saveMath(tex, false);
    });

    // 7. Restore code blocks before standard markdown preprocessing
    md = md.replace(/MARKSNAPCODE(\d+)END/g, function (_, idx) {
      return codeStore[parseInt(idx, 10)];
    });

    return {
      markdown: preprocessMarkdown(md),
      mathStore: mathStore
    };
  }

  function getMarkedParser() {
    var m = (typeof marked !== 'undefined') ? marked : (typeof window !== 'undefined' ? window.marked : null);
    if (!m) return null;
    if (typeof m === 'function') return m;
    if (typeof m.parse === 'function') return m.parse.bind(m);
    if (typeof m.marked === 'function') return m.marked;
    return null;
  }

  function renderMathPlaceholders(html, mathStore) {
    if (!mathStore || !mathStore.length) return html;
    return html.replace(/MARKSNAPMATH(\d+)END/g, function (match, idx) {
      var item = mathStore[parseInt(idx, 10)];
      if (!item) return match;
      if (typeof katex !== 'undefined' && typeof katex.renderToString === 'function') {
        try {
          return katex.renderToString(item.tex, {
            displayMode: item.display,
            throwOnError: false,
            strict: false,
            output: 'html'
          });
        } catch (e) {
          console.warn('KaTeX render error:', e);
        }
      }
      var escaped = escapeHtml(item.tex);
      return item.display
        ? '<div class="math-fallback math-display">' + escaped + '</div>'
        : '<span class="math-fallback math-inline">' + escaped + '</span>';
    });
  }

  var renderRetryTimer = null;

  // ─── Render Preview ──────────────────────────────────────────────
  function renderPreview() {
    var md = editor.value.trim();
    if (!md) {
      captureContent.innerHTML = [
        '<div class="empty-state">',
        '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">',
        '    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>',
        '    <polyline points="14 2 14 8 20 8"/>',
        '    <line x1="16" y1="13" x2="8" y2="13"/>',
        '    <line x1="16" y1="17" x2="8" y2="17"/>',
        '  </svg>',
        '  <p>在左侧编辑器中输入或粘贴 Markdown 内容<br>右侧将实时预览导出效果</p>',
        '</div>'
      ].join('\n');
      return;
    }

    var parseFn = getMarkedParser();
    if (!parseFn) {
      clearTimeout(renderRetryTimer);
      renderRetryTimer = setTimeout(function () {
        renderPreview();
      }, 150);
      return;
    }

    var extracted = extractMathAndPreprocess(md);
    var cleaned = extracted.markdown;
    var mathStore = extracted.mathStore;
    var html = '';

    try {
      var result = parseFn(cleaned);
      if (result && typeof result.then === 'function') {
        result.then(function (h) {
          try {
            captureContent.innerHTML = renderMathPlaceholders(h, mathStore);
          } catch (err) {
            console.error('renderMathPlaceholders error:', err);
            captureContent.innerHTML = h;
          }
          applyCodeHighlighting();
        }).catch(function (err) {
          console.error('marked async parse error:', err);
          captureContent.innerHTML = '<pre style="white-space:pre-wrap">' + escapeHtml(md) + '</pre>';
        });
        return;
      }
      html = result || '';
    } catch (e) {
      console.error('marked parse error:', e);
      html = '<pre style="white-space:pre-wrap">' + escapeHtml(md) + '</pre>';
    }

    try {
      captureContent.innerHTML = renderMathPlaceholders(html, mathStore);
    } catch (err) {
      console.error('renderMathPlaceholders error:', err);
      captureContent.innerHTML = html;
    }
    applyCodeHighlighting();
  }

  // Apply hljs syntax highlighting and inject language badge
  function applyCodeHighlighting() {
    if (typeof hljs === 'undefined') return;
    captureContent.querySelectorAll('pre code').forEach(function (block) {
      try { hljs.highlightElement(block); } catch (e) { /* ignore */ }

      var pre = block.parentElement;
      if (!pre || pre.tagName !== 'PRE') return;

      // Don't add badge twice
      if (pre.previousSibling && pre.previousSibling.classList && pre.previousSibling.classList.contains('code-header')) return;
      if (pre.querySelector && pre.querySelector('.code-header')) return;

      // Detect language from class: hljs sets 'language-xxx' or we read from the original class
      var lang = '';
      var classes = Array.prototype.slice.call(block.classList);
      for (var i = 0; i < classes.length; i++) {
        var m = classes[i].match(/^language-(.+)$/);
        if (m && m[1] && m[1] !== 'undefined') { lang = m[1]; break; }
      }
      // Also try hljs result class (e.g. 'python', 'javascript')
      if (!lang) {
        for (var j = 0; j < classes.length; j++) {
          if (classes[j] !== 'hljs' && classes[j].indexOf('language') === -1) {
            lang = classes[j]; break;
          }
        }
      }

      // Friendly display names
      var displayNames = {
        python: 'Python', javascript: 'JavaScript', js: 'JavaScript',
        typescript: 'TypeScript', ts: 'TypeScript',
        java: 'Java', go: 'Go', rust: 'Rust', cpp: 'C++', c: 'C',
        csharp: 'C#', cs: 'C#', php: 'PHP', ruby: 'Ruby',
        swift: 'Swift', kotlin: 'Kotlin', scala: 'Scala',
        shell: 'Shell', bash: 'Bash', sh: 'Shell', zsh: 'Shell',
        sql: 'SQL', html: 'HTML', css: 'CSS', xml: 'XML',
        json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML',
        markdown: 'Markdown', md: 'Markdown', r: 'R',
        dart: 'Dart', lua: 'Lua', perl: 'Perl', haskell: 'Haskell',
        plaintext: 'Text', text: 'Text',
      };
      var displayLang = lang ? (displayNames[lang.toLowerCase()] || lang.toUpperCase()) : 'Code';

      // Build header bar with language badge + copy button
      var header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML =
        '<span class="code-lang-badge">' + displayLang + '</span>' +
        '<span class="code-dots"><span></span><span></span><span></span></span>';

      // Wrap pre + header in a container
      var wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Apply Theme ─────────────────────────────────────────────────
  function applyTheme(theme) {
    currentTheme = theme;

    themeSelector.querySelectorAll('.theme-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    captureWrapper.className = 'theme-' + theme;

    var isDark = theme === 'dark';
    hljsThemeDark.disabled = !isDark;
    hljsThemeLight.disabled = isDark;

    renderPreview();
  }

  // ─── Apply Padding ───────────────────────────────────────────────
  function applyPadding(px) {
    var isGradient = currentTheme.startsWith('gradient-');
    if (isGradient) {
      captureContent.style.padding = px + 'px';
      captureContent.style.margin = Math.max(16, Math.round(px * 0.6)) + 'px';
    } else {
      captureContent.style.padding = px + 'px';
      captureContent.style.margin = '';
    }
  }

  // ─── Download Image ──────────────────────────────────────────────
  function downloadImage() {
    var scale = parseInt(settingScale.value);
    showLoading(true);

    sleep(50).then(function () {
      return html2canvas(captureWrapper, {
        scale: scale,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true,
      });
    }).then(function (canvas) {
      var link = document.createElement('a');
      link.download = 'marksnap_' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('图片已下载 ✓', 'success');
    }).catch(function (err) {
      console.error('Export error:', err);
      showToast('导出失败：' + err.message, 'error');
    }).finally(function () {
      showLoading(false);
    });
  }

  // ─── Copy Image to Clipboard ─────────────────────────────────────
  function copyImageToClipboard() {
    var scale = parseInt(settingScale.value);
    showLoading(true);

    sleep(50).then(function () {
      return html2canvas(captureWrapper, {
        scale: scale,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        removeContainer: true,
      });
    }).then(function (canvas) {
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('toBlob failed')); return; }
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(function () {
            showToast('图片已复制到剪贴板 ✓', 'success');
            resolve();
          }).catch(function () {
            // Fallback: download
            var link = document.createElement('a');
            link.download = 'marksnap_' + Date.now() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('浏览器不支持复制图片，已改为下载', 'info');
            resolve();
          });
        }, 'image/png');
      });
    }).catch(function (err) {
      console.error('Copy error:', err);
      showToast('复制失败：' + err.message, 'error');
    }).finally(function () {
      showLoading(false);
    });
  }

  // ─── File Loading ────────────────────────────────────────────────
  function handleFileLoad(e) {
    var file = e.target.files[0];
    if (file) loadFileContent(file);
    fileInput.value = '';
  }

  function loadFileContent(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      editor.value = e.target.result;
      renderPreview();
      updateStats();
      showToast('已加载：' + file.name, 'success');
    };
    reader.onerror = function () { showToast('文件读取失败', 'error'); };
    reader.readAsText(file);
  }

  // ─── Resize Handle ───────────────────────────────────────────────
  function bindResizeHandle() {
    var isResizing = false;
    var startX = 0;
    var startWidth = 0;

    resizeHandle.addEventListener('mousedown', function (e) {
      isResizing = true;
      startX = e.clientX;
      startWidth = editorPanel.offsetWidth;
      resizeHandle.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!isResizing) return;
      var diff = e.clientX - startX;
      var newWidth = Math.max(300, Math.min(window.innerWidth - 400, startWidth + diff));
      editorPanel.style.width = newWidth + 'px';
    });

    document.addEventListener('mouseup', function () {
      if (!isResizing) return;
      isResizing = false;
      resizeHandle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }

  // ─── Stats ───────────────────────────────────────────────────────
  function updateStats() {
    var text = editor.value;
    charCount.textContent = text.length + ' 字符';
    lineCount.textContent = (text ? text.split('\n').length : 0) + ' 行';
  }

  // ─── Toast ───────────────────────────────────────────────────────
  function showToast(message, type) {
    type = type || 'info';
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.className = 'toast ' + type;
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2500);
  }

  // ─── Loading ─────────────────────────────────────────────────────
  function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
  }

  // ─── Helpers ─────────────────────────────────────────────────────
  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // ─── Go! ─────────────────────────────────────────────────────────
  init();

})();
