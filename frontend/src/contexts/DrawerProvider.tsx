import { JSX, createContext, useContext } from "solid-js"
import { Fatal } from "../core/core"
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
  if (ctx === undefined) throw new Fatal("current drawer context was undefined")
  return ctx
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
