import { ClientSideSuspense, RoomProvider } from '@liveblocks/react'
import React from 'react'
import Loading from '../components/Loader/Loader'
import { uniqueId } from 'lodash'
import TiptapEditor from '../components/Docs/TipTapEditor/TiptapEditor'

const Test = () => {
  return (
     <RoomProvider
          id={`docs_${uniqueId()}`}
          initialPresence={{
            cursor: null,
          }}
        >
          <ClientSideSuspense fallback={<Loading />}>
            <TiptapEditor />
          </ClientSideSuspense>
        </RoomProvider>
  )
}

export default Test;