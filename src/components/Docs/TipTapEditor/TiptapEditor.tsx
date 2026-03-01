import {
  useLiveblocksExtension,
  Toolbar,
  FloatingComposer,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlock from "@tiptap/extension-code-block";
import { Markdown } from "tiptap-markdown";
import { marked } from "marked";
import styles from "./TipTapEditor.module.css";
import { useEffect } from "react";
import Threads from "../Threads/Threads";
import NotificationsPopover from "../NotificationsPopover/NotificationsPopover";
import CodeBlockComponent from "./CodeBlock";
interface TiptapEditorProps {
  initialContent?: string | null;
}

export default function TiptapEditor({ initialContent }: TiptapEditorProps) {
  const htmlContent = initialContent ? marked.parse(initialContent, { async: false }) as string : '';

  const liveblocks = useLiveblocksExtension({
    initialContent: htmlContent,
  });

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
    extensions: [
      StarterKit.configure({
        history: false,
        codeBlock: false,
      }),
      CodeBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }),
      Markdown,
      liveblocks,
    ],
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      editor.commands.focus("end");
    }
  }, [editor]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <NotificationsPopover />
      </div>

      <div className={styles.toolbarWrapper}>
        <Toolbar editor={editor} className={styles.toolbar} />
      </div>

      <div className={styles.main}>
        <div className={styles.editorSection}>
          <EditorContent editor={editor} />
          <FloatingComposer editor={editor} className={styles.composer} />
          <FloatingToolbar editor={editor} />
        </div>
        <div className={styles.threadsWrapper}>
          <Threads editor={editor} />
        </div>
      </div>
    </div>
  );
}
