import {
  useLiveblocksExtension,
  Toolbar,
  FloatingComposer,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import styles from "./TipTapEditor.module.css";
import { useEffect } from "react";
import NotificationsPopover from "../NotificationsPopover/NotificationsPopover";
import Threads from "../Threads/Threads";

export default function TiptapEditor() {
  const liveblocks = useLiveblocksExtension();

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      liveblocks,
    ],
  });

  useEffect(() => {
    if (editor) {
      editor.commands.focus("end");
    }
  }, [editor]);

  return (
    <div className={styles.root}>
      {/* <div className={styles.header}>
        <NotificationsPopover />
      </div> */}

      <div className={styles.toolbarWrapper}>
        <Toolbar editor={editor} className={styles.toolbar} />
      </div>

      {/* <div className={styles.main}>
        <div className={styles.editorSection}>
          <EditorContent editor={editor} />
          <FloatingComposer editor={editor} className={styles.composer} />
          <FloatingToolbar editor={editor} />
        </div>
        <div className={styles.threadsWrapper}>
          <Threads editor={editor} />
        </div>
      </div> */}
    </div>
  );
}
