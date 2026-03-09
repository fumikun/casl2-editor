import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { buildComment, isSupportedOpcode } from './operands'
import { CommentRules } from './RuleModal'

type ParsedLine = {
  label: string | null
  opcode: string
  operand: string
}

const parseInstructionLine = (line: string): ParsedLine | null => {
  const parts = line.split('\t').map((part) => part.trim())

  if (parts.length === 0 || parts.every((part) => part === '')) {
    return null
  }

  if (parts.length >= 2 && isSupportedOpcode(parts[1])) {
    return {
      label: parts[0] || null,
      opcode: parts[1],
      operand: parts.slice(2).join('\t').trim(),
    }
  }

  if (isSupportedOpcode(parts[0])) {
    return {
      label: null,
      opcode: parts[0],
      operand: parts.slice(1).join('\t').trim(),
    }
  }

  return null
}

const addComment = (line: string, addTab: boolean) => {
  const normalizedLine = line.replace(/\r$/, '')

  if (normalizedLine.trim() === '' || normalizedLine.trimStart().startsWith(';')) {
    return normalizedLine
  }

  const trimmed = normalizedLine.replace(/\s+$/, '')
  const parsed = parseInstructionLine(trimmed)

  if (!parsed) {
    return normalizedLine
  }

  const comment = buildComment(parsed.label, parsed.opcode, parsed.operand)

  if (!comment) {
    return normalizedLine
  }

  const tab = addTab ? '\t\t' : '\t'

  return `${trimmed}${tab};${comment}`
}

const convertWithComments = (source: string, addTab: boolean) =>
  source
    .split('\n')
    .map((line) => addComment(line, addTab))
    .join('\n')

const syncScrollPosition = (from: HTMLTextAreaElement | null, to: HTMLTextAreaElement | null) => {
  if (!from || !to) return

  to.scrollTop = from.scrollTop
  to.scrollLeft = from.scrollLeft
}

const getLineNumberByCursor = (text: string, cursorPosition: number) => {
  if (cursorPosition <= 0) return 1

  const beforeCursor = text.slice(0, cursorPosition)
  const lineBreakCount = beforeCursor.match(/\n/g)?.length ?? 0
  return lineBreakCount + 1
}

function App() {
  const [source, setSource] = useState('')
  const [addTab, setAddTab] = useState(false)

  const converted = useMemo(
    () => convertWithComments(source, addTab),
    [source, addTab],
  )

  const [activeLine, setActiveLine] = useState(1)
  const [lineHeight, setLineHeight] = useState(24)
  const [editorPaddingTop, setEditorPaddingTop] = useState(12)
  const [syncedScrollTop, setSyncedScrollTop] = useState(0)
  const [showRules, setShowRules] = useState(false)

  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const syncLockRef = useRef(false)

  const updateCursorLine = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return

    const cursorLine = getLineNumberByCursor(
      element.value,
      element.selectionStart ?? 0,
    )

    setActiveLine(cursorLine)
  }, [])

  const measureEditorMetrics = useCallback(() => {
    const editor = sourceRef.current
    if (!editor) return

    const computedStyle = window.getComputedStyle(editor)

    const resolvedLineHeight = Number.parseFloat(computedStyle.lineHeight)
    const resolvedPaddingTop = Number.parseFloat(computedStyle.paddingTop)

    if (Number.isFinite(resolvedLineHeight)) {
      setLineHeight(resolvedLineHeight)
    }

    if (Number.isFinite(resolvedPaddingTop)) {
      setEditorPaddingTop(resolvedPaddingTop)
    }
  }, [])

  const syncScroll = useCallback((from: 'source' | 'output') => {
    if (syncLockRef.current) return

    const fromEl = from === 'source' ? sourceRef.current : outputRef.current
    const toEl = from === 'source' ? outputRef.current : sourceRef.current

    if (!fromEl || !toEl) return

    syncLockRef.current = true

    syncScrollPosition(fromEl, toEl)

    setSyncedScrollTop(fromEl.scrollTop)

    window.requestAnimationFrame(() => {
      syncLockRef.current = false
    })
  }, [])

  const cursorLineStyle = useMemo(
    () => ({
      transform: `translateY(${editorPaddingTop + (activeLine - 1) * lineHeight - syncedScrollTop}px)`,
      height: `${lineHeight}px`,
    }),
    [activeLine, editorPaddingTop, lineHeight, syncedScrollTop],
  )

  useEffect(() => {
    measureEditorMetrics()

    window.addEventListener('resize', measureEditorMetrics)

    return () => {
      window.removeEventListener('resize', measureEditorMetrics)
    }
  }, [measureEditorMetrics])

  useEffect(() => {
    syncScrollPosition(sourceRef.current, outputRef.current)
  }, [converted])

  function handleCopy() {
    if (!outputRef.current) return

    navigator.clipboard.writeText(outputRef.current.value)
  }

  return (
    <main className="app">
      <h1>CASL2 コメント生成</h1>
      <div className="topButtons">
        <button onClick={() => setShowRules(true)}>
          コメント生成ルール
        </button>
      </div>
      <p className="description">
        左に命令を入力すると、右にコメント付きの結果をライブ表示するやつ
      </p>
      <div className="radioButton">
        <input
          type="checkbox"
          id="addTab"
          checked={addTab}
          onChange={(event) => setAddTab(event.target.checked)}
        />
        <label htmlFor="addTab">追加でTabを挿入する</label>
      </div>
      <div className="editorGrid">
        <section className="panel">
          <h2>入力</h2>
          <div className="editorWrap">
            <div className="cursorLine" style={cursorLineStyle} aria-hidden="true" />
            <textarea
              className="editor"
              ref={sourceRef}
              value={source}
              onChange={(event) => {
                setSource(event.target.value)
                updateCursorLine(event.target)
              }}
              onSelect={(event) => updateCursorLine(event.currentTarget)}
              onClick={(event) => updateCursorLine(event.currentTarget)}
              onKeyUp={(event) => updateCursorLine(event.currentTarget)}
              onFocus={(event) => updateCursorLine(event.currentTarget)}
              onScroll={() => syncScroll('source')}
              spellCheck={false}
              wrap="off"
              placeholder={'\tLD\tGR1,VALUE\nVALUE\tDC\t100'}
            />
          </div>
        </section>
        <section className="panel">
          <div className="outputAreaHeader">
            <h2>出力（ライブ）</h2>
            <button onClick={handleCopy}>
              出力をコピー
            </button>
          </div>
          <div className="editorWrap">
            <div className="cursorLine" style={cursorLineStyle} aria-hidden="true" />
            <textarea
              className="editor"
              ref={outputRef}
              value={converted}
              onSelect={(event) => updateCursorLine(event.currentTarget)}
              onClick={(event) => updateCursorLine(event.currentTarget)}
              onKeyUp={(event) => updateCursorLine(event.currentTarget)}
              onFocus={(event) => updateCursorLine(event.currentTarget)}
              onScroll={() => syncScroll('output')}
              readOnly
              spellCheck={false}
              wrap="off"
            />
          </div>
        </section>
      </div>
      {showRules && (
        <div className="modalOverlay" onClick={() => setShowRules(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <CommentRules />
          </div>
        </div>
      )}
    </main>
  )
}

export default App