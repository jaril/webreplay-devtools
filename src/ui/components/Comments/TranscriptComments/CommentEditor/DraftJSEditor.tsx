import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Draft from "draft-js";

import { User } from "ui/types";

import useDraftJS, { DraftJSModule, LazyLoadDraftConfig } from "./use-draftjs";
import { addMentions, convertToMarkdown, mentionsEnabled } from "./mention";

import "./DraftJSEditor.css";

const moveSelectionToEnd = (editorState: Draft.EditorState, DraftJS: DraftJSModule) => {
  const { EditorState, SelectionState } = DraftJS;
  const content = editorState.getCurrentContent();
  const blockMap = content.getBlockMap();
  const key = blockMap.last().getKey();
  const length = blockMap.last().getLength();

  // On Chrome and Safari, calling focus on contenteditable focuses the
  // cursor at the first character. This is something you don't expect when
  // you're clicking on an input element but not directly on a character.
  // Put the cursor back where it was before the blur.
  const selection = new SelectionState({
    anchorKey: key,
    anchorOffset: length,
    focusKey: key,
    focusOffset: length,
  });
  return EditorState.forceSelection(editorState, selection);
};

export interface DraftJSAPI {
  getText: () => string;
  focus: () => void;
  blur: () => void;
}

interface InternalApi extends DraftJSAPI {
  state?: Draft.EditorState;
  config?: LazyLoadDraftConfig;
}

interface DraftJSEditorProps {
  api: (api: DraftJSAPI) => void;
  initialContent: string;
  placeholder: string;
  handleSubmit: (text: string) => void;
  handleCancel: () => void;
  users?: User[];
}

export default function DraftJSEditor({
  api,
  handleCancel,
  handleSubmit,
  initialContent,
  placeholder,
  users,
}: DraftJSEditorProps) {
  const editorNode = useRef<Draft.Editor>(null);
  const wrapperNode = useRef<HTMLDivElement>(null);
  const [mentionSearchText, setMentionSearchText] = useState("");
  const [open, setOpen] = useState(false);
  const [editorState, setEditorState] = useState<Draft.EditorState>();
  const [config, setConfig] = useState<LazyLoadDraftConfig>();
  const load = useDraftJS();
  const publicApi = useRef<InternalApi>({
    state: undefined,
    config: undefined,
    focus: () => editorNode.current && editorNode.current.focus(),
    blur: () => editorNode.current && editorNode.current.blur(),
    getText: function () {
      return this.state && this.config
        ? convertToMarkdown(this.state, this.config.modules.DraftJS)
        : "";
    },
  });

  const handleChange = useCallback(
    (updated: Draft.EditorState) => {
      publicApi.current.state = updated;
      setEditorState(updated);
    },
    [setEditorState]
  );

  useEffect(() => {
    if (api) api(publicApi.current);
  }, [api]);

  useEffect(
    function importDraftJS() {
      load().then(cfg => {
        const {
          modules: { DraftJS, Editor },
        } = cfg;

        let es = Editor.createEditorStateWithText(initialContent);
        if (users) {
          es = addMentions(DraftJS, es, users);
        }

        setEditorState(es);
        setConfig(cfg);
        publicApi.current.config = cfg;
      });
    },
    [users]
  );

  const decorator = editorState?.getDecorator();
  useEffect(() => {
    // This guards against calling focus() with a stale editorNode reference
    // that doesn't yet have the emoji decorators attached.
    if (!decorator) return;

    // The order is important here — we focus the editor first before scrolling the
    // wrapper into view. Otherwise, the scrolling animation is interrupted by the focus.
    editorNode.current!.focus();
    wrapperNode.current!.scrollIntoView({ block: "center", behavior: "smooth" });
    const { bottom } = wrapperNode.current!.getBoundingClientRect();
    const { innerHeight } = window;

    // Toggle a class to render the emoji popup above the editor when close to the bottom
    wrapperNode.current!.classList.toggle("flipPopup", innerHeight - bottom < 300);

    // Move the cursor so that it's at the end of the selection instead of the beginning.
    // Which DraftJS doesn't make easy: https://github.com/brijeshb42/medium-draft/issues/71
    setEditorState(state =>
      state && config?.modules.DraftJS
        ? moveSelectionToEnd(state, config?.modules.DraftJS)
        : undefined
    );
  }, [decorator]);

  const keyBindingFn = (e: React.KeyboardEvent) => {
    if (
      e.keyCode == 13 &&
      e.metaKey &&
      config?.modules.DraftJS.KeyBindingUtil.hasCommandModifier(e)
    ) {
      return "save";
    }
    if (e.keyCode == 27) {
      return "cancel";
    }

    return config?.modules.DraftJS.getDefaultKeyBinding(e);
  };
  const handleKeyCommand = (command: "save" | "cancel") => {
    if (command === "save") {
      handleSubmit(publicApi.current.getText());
      return "handled";
    } else if (command === "cancel") {
      handleCancel();
      return "handled";
    }

    return "not-handled";
  };

  const filteredUsers = useMemo(
    () =>
      users
        ? users.filter(
            u => u.name.includes(mentionSearchText) || u.nickname.includes(mentionSearchText)
          )
        : [],
    [mentionSearchText, users]
  );

  if (!config) return null;

  const {
    emojiPlugin,
    mentionPlugin,
    modules: {
      Editor: { default: Editor },
    },
  } = config;
  const { EmojiSuggestions } = emojiPlugin;
  const { MentionSuggestions } = mentionPlugin;

  return (
    <div className="draft-editor-container" ref={wrapperNode}>
      <Editor
        editorState={editorState}
        onChange={handleChange}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
        placeholder={placeholder}
        plugins={[emojiPlugin, mentionsEnabled() && mentionPlugin]}
        ref={editorNode}
        webDriverTestID="draftjs-editor"
      />
      <EmojiSuggestions />
      <MentionSuggestions
        suggestions={filteredUsers}
        onSearchChange={({ value }: { trigger: string; value: string }) =>
          setMentionSearchText(value)
        }
        onOpenChange={setOpen}
        open={open}
      />
    </div>
  );
}
