import { useThreads } from "@liveblocks/react";
import { AnchoredThreads, FloatingThreads } from "@liveblocks/react-tiptap";
import { useMediaQuery } from "@mantine/hooks";
import { Editor } from "@tiptap/react";
import styles from "./Threads.module.css";

function Threads({ editor }: { editor: Editor | null }) {
  const { threads } = useThreads();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  if (!threads || !editor) {
    return null;
  }

  return isSmallScreen ? (
    <FloatingThreads threads={threads} editor={editor} />
  ) : (
    <AnchoredThreads
      threads={threads}
      editor={editor}
      className={styles.anchoredThreads}
    />
  );
}

export default Threads;
