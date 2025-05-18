import { Accessor, ParentProps, createContext, useContext } from "solid-js"
import { optionExpect } from "~/core/core"
import { Book, Note, User } from "~/core/types"

type DrawerContextProps = {
  currentUser: Accessor<User | undefined>
  currentBook: Accessor<Book | undefined>
  currentNote: Accessor<Note | undefined>
  updateBook: (newBook: Book) => void
  updateNote: (newNote: Note) => void
  deleteBook: (bookId: string) => void
  deleteNote: (noteId: string) => void
}

const makeDrawerContext = (props: DrawerContextProps) => {
  return props
}

type DrawerContextType = ReturnType<typeof makeDrawerContext>
export const DrawerContext = createContext<DrawerContextType>()
export const useDrawer = () => {
  let ctx = useContext(DrawerContext)
  return optionExpect(ctx, "current drawer context was undefined")
}

type DrawerProviderProps = DrawerContextProps & ParentProps & {
}

export const DrawerProvider = (props: DrawerProviderProps) => {
  return (
    <DrawerContext.Provider value={makeDrawerContext(props)}>
      {props.children}
    </DrawerContext.Provider>
  )
}
