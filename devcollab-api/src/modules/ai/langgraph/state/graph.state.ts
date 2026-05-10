import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

/**
 * Defines the structured state for the LangGraph execution.
 * This is specific to how LangGraph manages message history and metadata.
 */
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  iterationCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
});
