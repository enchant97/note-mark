import { JSX, createContext, useContext } from "solid-js"
import { optionExpect } from "../core/core"
import { Book, Note } from "../core/types"

type DrawerContextProps = {
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

type DrawerProviderProps = DrawerContextProps & {
  children: JSX.Element
}

export const DrawerProvider = (props: DrawerProviderProps) => {
  return (
    <DrawerContext.Provider value={makeDrawerContext(props)}>
      {props.children}
    </DrawerContext.Provider>
  )
}
