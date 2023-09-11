import { Component, Match, Show, Switch, createResource } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useParams, useSearchParams } from '@solidjs/router';
import { Book, Breadcrumb, Note } from '../core/types';
import NoteBreadcrumb from '../components/note/breadcrumb';
import { useModal } from '../contexts/ModalProvider';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import NewBookModal from '../components/modals/new_book';
import NewNoteModal from '../components/modals/new_note';
import UpdateBookModal from '../components/modals/edit_book';
import UpdateNoteModal from '../components/modals/edit_note';
import { useDrawer } from '../contexts/DrawerProvider';
import { LoadingBar } from '../components/loading';
import { apiErrorIntoToast, useToast } from '../contexts/ToastProvider';
import { ApiError } from '../core/api';
import Icon from '../components/icon';
import NoteViewRendered from '../components/note/view_rendered';
import NoteViewPlain from '../components/note/view_plain';
import NoteEdit from '../components/note/edit';

const Shelf: Component = () => {
  const params = useParams()
  const { api } = useApi()
  const { pushToast } = useToast()
  const { user } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setModal, clearModal } = useModal()
  const drawer = useDrawer()

  const noteMode = () => {
    let mode = searchParams.mode
    if (mode === undefined) return "rendered"
    else return mode
  }

  const slugParts: () => Breadcrumb = () => {
    return {
      username: params.username,
      bookSlug: params.bookSlug,
      noteSlug: params.noteSlug,
    }
  }

  const allowBookCreate = () => {
    return user()?.username === slugParts().username
  }

  const allowNoteCreate = () => {
    return user() && (book() && user()?.id === book()?.ownerId)
  }

  const [book, { mutate: setBook }] = createResource(slugParts, async ({ username, bookSlug }) => {
    if (!username || !bookSlug) return undefined
    let result = await api().getBookBySlug(username, bookSlug)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, `loading book ${username}/${bookSlug}`))
    else return result
  })

  const [note, { mutate: setNote }] = createResource(slugParts, async ({ username, bookSlug, noteSlug }) => {
    if (!username || !bookSlug || !noteSlug) return undefined
    let result = await api().getNoteBySlug(username, bookSlug, noteSlug)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, `loading note ${username}/${bookSlug}/${noteSlug}`))
    else return result
  })

  const [noteContent, { mutate: setNoteContent }] = createResource(note, async (note) => {
    let result = await api().getNoteContentById(note.id)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "getting note content"))
      return
    } else {
      if (!result.endsWith("\n")) {
        result += "\n"
      }
      return result
    }
  })

  const breadcrumb: () => Breadcrumb = () => {
    return {
      username: params.username,
      bookSlug: book()?.name,
      noteSlug: note()?.name,
    }
  }

  const onNewBookClick = () => {
    setModal({
      component: NewBookModal,
      props: {
        onClose: (newBook?: Book) => {
          if (newBook) drawer.updateBook(newBook)
          clearModal()
        }, user: user()
      },
    })
  }
  const onNewNoteClick = () => {
    setModal({
      component: NewNoteModal,
      props: {
        onClose: (newNote?: Note) => {
          if (newNote) drawer.updateNote(newNote)
          clearModal()
        }, user: user(), book: book()
      },
    })
  }

  const onUpdateBookClick = () => {
    setModal({
      component: UpdateBookModal,
      props: {
        onClose: (newBook?: Book) => {
          if (newBook) {
            setBook(newBook)
            drawer.updateBook(newBook)
          }
          clearModal()
        },
        onDeleteClose: (bookId: string) => {
          drawer.deleteBook(bookId)
          clearModal()
        },
        user: user(), book: book()
      },
    })
  }

  const onUpdateNoteClick = () => {
    setModal({
      component: UpdateNoteModal,
      props: {
        onClose: (newNote?: Note) => {
          if (newNote) {
            setNote(newNote)
            drawer.updateNote(newNote)
          }
          clearModal()
        },
        onDeleteClose: (noteId: string) => {
          drawer.deleteNote(noteId)
          clearModal()
        },
        user: user(), book: book(), note: note(),
      },
    })
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex gap-4">
        <div class="join rounded-lg shadow-md bg-base-200">
          <button
            onclick={onNewBookClick}
            class="btn join-item btn-ghost"
            type="button"
            disabled={!allowBookCreate()}
            title="Create New Notebook"
          >
            <Icon name="folder-plus" />
          </button>
          <button
            onclick={onNewNoteClick}
            class="btn join-item btn-ghost"
            type="button"
            disabled={!allowNoteCreate()}
            title="Create New Note"
          >
            <Icon name="file-plus" />
          </button>
          <Switch>
            <Match when={book() && !note()}>
              <button
                onclick={onUpdateBookClick}
                class="btn join-item btn-ghost"
                type="button"
                disabled={!allowNoteCreate()}
                title="Notebook Settings"
              >
                <Icon name="settings" />
                <Icon name="folder" />
              </button>
            </Match>
            <Match when={book() && note()}>
              <button
                onclick={onUpdateNoteClick}
                class="btn join-item btn-ghost"
                type="button"
                disabled={!allowNoteCreate()}
                title="Note Settings"
              >
                <Icon name="settings" />
                <Icon name="file" />
              </button>
            </Match>
          </Switch>
        </div>
        <NoteBreadcrumb class="flex-1" {...breadcrumb()} />
      </div>
      <Show when={!note.loading && !noteContent.loading} fallback={<LoadingBar />}>
        <Show when={note()} fallback={
          <div class="hero pt-6 bg-base-200 rounded-md">
            <div class="hero-content text-center">
              <div class="max-w-md">
                <h1 class="text-5xl font-bold">No Note Selected</h1>
                <p class="py-6">Either create a new note or select an existing one.</p>
              </div>
            </div>
          </div>
        }>
          {note => <>
            <div class="bg-base-200 shadow-md rounded-md">
              <div class="tabs justify-center">
                <button
                  onclick={() => setSearchParams({ mode: undefined })}
                  class="tab"
                  classList={{ "tab-active": noteMode() === "rendered" }}
                  title="switch to rendered view"
                >Rendered</button>
                <button
                  onclick={() => setSearchParams({ mode: "plain" })}
                  class="tab"
                  classList={{ "tab-active": noteMode() === "plain" }}
                  title="switch to plain view"
                >Plain</button>
                <button
                  onclick={() => setSearchParams({ mode: "edit" })}
                  class="tab"
                  disabled={!allowNoteCreate()}
                  classList={{ "tab-active": noteMode() === "edit" }}
                  title="switch to editor"
                >Editor</button>
              </div>
            </div>
            <Show when={noteContent()}>
              {content => <Switch fallback={<NoteViewRendered content={content} />}>
                <Match when={noteMode() === "plain"}>
                  <NoteViewPlain content={content} />
                </Match>
                <Match when={noteMode() === "edit"}>
                  <NoteEdit note={note()} content={content} onChange={setNoteContent} />
                </Match>
              </Switch>}
            </Show>
          </>
          }
        </Show>
      </Show>
    </div>
  );
};

export default Shelf;
