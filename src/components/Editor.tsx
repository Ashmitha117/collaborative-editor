import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { yCollab } from "y-codemirror.next";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { bracketMatching } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";

import { getAutoComplete, type SupportedLanguage } from "./AutoComplete";
import { getLanguageExtension, getThemeExtensions, type EditorTheme } from "./editorConfig";

type EditorProps = {
  yText: Y.Text;
  provider: WebsocketProvider;
  className?: string;
  language?: SupportedLanguage;
  theme?: EditorTheme;
};

export type { EditorTheme };

const Editor = ({
  yText,
  provider,
  className,
  language = "javascript",
  theme = "dark",
}: EditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        basicSetup,
        ...getThemeExtensions(theme),
        getLanguageExtension(language),
        bracketMatching(),
        closeBrackets(),
        getAutoComplete(language),
        yCollab(yText, provider.awareness, {
          undoManager: new Y.UndoManager(yText),
        }),
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [yText, provider, language, theme]);

  return <div ref={editorRef} className={className} />;
};

export default Editor;
