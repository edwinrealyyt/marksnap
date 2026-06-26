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

  // ─── Sample Markdown ─────────────────────────────────────────────
  var SAMPLE_MD = [
    '# 🚀 MarkSnap 使用演示',
    '',
    '将 AI 回答 / Markdown 内容一键转为**精美截图**，方便分享到微信、钉钉、飞书等平台。',
    '',
    '## ✨ 标准 Markdown 表格',
    '',
    '| 功能 | 说明 | 状态 |',
    '|------|------|------|',
    '| Markdown 渲染 | 完整的 GFM 支持 | ✅ 已完成 |',
    '| 代码高亮 | 支持 190+ 语言 | ✅ 已完成 |',
    '| 多主题切换 | 6 种精美主题 | ✅ 已完成 |',
    '| 导出 PNG | 高清多倍率导出 | ✅ 已完成 |',
    '| 复制到剪贴板 | 一键复制图片 | ✅ 已完成 |',
    '',
    '## 🤖 AI 生成的断行表格（自动修复）',
    '',
    '> MarkSnap 自动修复 AI 输出的带 `<br>` 断行表格，无需手动整理格式。',
    '',
    '| 维度 | GPT-4o | Gemini 1.5 Pro<br>',
    '<br>*Google 出品* | Claude 3.5 Sonnet |',
    '| --- | --- | --- | --- |',
    '| **上下文窗口** | **128K tokens**<br>',
    '<br>（约 10 万字）| **100 万 tokens**<br>',
    '<br>（业界最长，适合超长文档分析）| **200K tokens** |',
    '| **代码能力** | **极强**<br>',
    '<br>插件生态丰富，支持代码执行 | **较强**<br>',
    '<br>与 Google 工具链深度集成 | **顶尖**<br>',
    '<br>公认代码理解与生成最佳 |',
    '| **多模态支持** | ✅ 图片 / 视频 / 音频 | ✅ 图片 / 视频 / 音频 | ✅ 图片（文字理解最强）|',
    '| **中文表现** | 良好 | 良好 | 优秀 |',
    '',
    '## 💻 代码高亮',
    '',
    '```python',
    'def fibonacci(n: int) -> list[int]:',
    '    """生成斐波那契数列"""',
    '    fib = [0, 1]',
    '    for i in range(2, n):',
    '        fib.append(fib[i-1] + fib[i-2])',
    '    return fib',
    '',
    'print(fibonacci(10))',
    '# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]',
    '```',
    '',
    '## 📝 引用 & 列表',
    '',
    '> **提示：** 将 ChatGPT、Gemini、Claude 等 AI 的回答直接粘贴到左侧编辑器，右侧实时预览，点击「下载 PNG」即可导出。',
    '',
    '- 🎨 支持 **6 种导出主题**：亮色、暗色、GitHub、蓝紫渐变、日落渐变、翠绿渐变',
    '- 📐 可调节宽度、内边距、字号',
    '- 🔍 支持 1x / 2x / 3x 高清导出',
    '- 📋 支持一键复制图片到剪贴板',
    '',
    '---',
    '',
    '*由 MarkSnap 生成 · 让分享更优雅*'
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

        // Phase 3: Detect & normalize separator rows
        var stripped = ln.replace(/\s/g, '');
        // A separator row looks like: |---|---| or |:---|:---:| etc.
        if (/^\|?([-:]+\|)+[-:]*$/.test(stripped)) {
          var pipeCount = (ln.match(/\|/g) || []).length;
          var colCount = Math.max(pipeCount - 1, 1);
          var parts = [];
          for (var k = 0; k < colCount; k++) parts.push('---');
          ln = '| ' + parts.join(' | ') + ' |';
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

    var cleaned = preprocessMarkdown(md);
    var html = '';

    try {
      if (typeof marked === 'undefined') {
        html = '<pre style="white-space:pre-wrap">' + escapeHtml(md) + '</pre>';
      } else {
        var result = marked.parse(cleaned);
        if (result && typeof result.then === 'function') {
          // async version
          result.then(function (h) {
            captureContent.innerHTML = h;
            applyCodeHighlighting();
          }).catch(function () {
            captureContent.innerHTML = '<pre style="white-space:pre-wrap">' + escapeHtml(md) + '</pre>';
          });
          return;
        }
        html = result || '';
      }
    } catch (e) {
      console.error('marked.parse error:', e);
      html = '<pre style="white-space:pre-wrap">' + escapeHtml(md) + '</pre>';
    }

    captureContent.innerHTML = html;
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
