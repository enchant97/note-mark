import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useParams } from '@solidjs/router';
import { Book, Breadcrumb, Note as NoteDetails } from '../core/types';
import NoteBreadcrumb from '../components/note/breadcrumb';
import { useModal } from '../contexts/ModalProvider';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import NewBookModal from '../components/modals/new_book';
import NewNoteModal from '../components/modals/new_note';
import UpdateBookModal from '../components/modals/edit_book';
import UpdateNoteModal from '../components/modals/edit_note';
import { useDrawer } from '../contexts/DrawerProvider';
import { LoadingRing } from '../components/loading';
import { ToastType, apiErrorIntoToast, useToast } from '../contexts/ToastProvider';
import { ApiError } from '../core/api';
import Icon from '../components/icon';
import Note, { NoteMode } from '../components/note';
import StorageHandler from '../core/storage';
import AssetsModal from '../components/modals/assets';

const Shelf: Component = () => {
  const params = useParams()
  const { api } = useApi()
  const { pushToast } = useToast()
  const { user } = useCurrentUser()
  const { setModal, clearModal } = useModal()
  const drawer = useDrawer()
  const [noteModeSetting, setNoteModeSetting] = StorageHandler.createSettingSignal("note_mode", false)

  const noteMode = () => {
    let stored = noteModeSetting() as NoteMode | null
    if ((stored === NoteMode.EDIT && !allowNoteCreate()) || stored === null) {
      return NoteMode.RENDERED
    }
    return stored
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

  const globalLoading = () => book.loading || note.loading || noteContent.loading

  const breadcrumb: () => Breadcrumb = () => {
    return {
      username: params.username,
      bookSlug: globalLoading() ? undefined : book()?.name,
      noteSlug: globalLoading() ? undefined : note()?.name,
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
        onClose: (newNote?: NoteDetails) => {
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
        user: user(),
        book: book(),
        restoreNote: drawer.updateNote,
      },
    })
  }

  const onUpdateNoteClick = () => {
    setModal({
      component: UpdateNoteModal,
      props: {
        onClose: (newNote?: NoteDetails) => {
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

  const onNoteAssetsClick = () => {
    setModal({
      component: AssetsModal,
      props: {
        onClose: clearModal,
        noteId: note()?.id
      },
    })
  }

  const onShareClick = async () => {
    if (!window.isSecureContext) {
      pushToast({ message: "feature only available in secure contexts", type: ToastType.ERROR })
    } else if ((await navigator.permissions.query({ name: "clipboard-write" as PermissionName })).state === "granted") {
      await navigator.clipboard.writeText(location.href);
      pushToast({ message: "copied to clipboard", type: ToastType.SUCCESS })
    } else {
      pushToast({ message: "clipboard access not granted", type: ToastType.ERROR })
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex gap-4 flex-col sm:flex-row">
        <menu class="menu menu-horizontal shadow-md rounded-lg bg-base-200">
          <li classList={{ "disabled": globalLoading() || !allowBookCreate() }}>
            <button
              onclick={onNewBookClick}
              type="button"
              disabled={globalLoading() || !allowBookCreate()}
              title="Create New Notebook"
            >
              <Icon name="folder-plus" />
            </button>
          </li>
          <li classList={{ "disabled": globalLoading() || !allowNoteCreate() }}>
            <button
              onclick={onNewNoteClick}
              type="button"
              disabled={globalLoading() || !allowNoteCreate()}
              title="Create New Note"
            >
              <Icon name="file-plus" />
            </button>
          </li>
          <li classList={{ "disabled": globalLoading() }}>
            <Show when={!globalLoading()} fallback={<div><Icon name="more-horizontal" /></div>}>
              <details class="dropdown">
                <summary><Icon name="more-horizontal" /></summary>
                <ul class="p-2 shadow-lg menu dropdown-content z-[1] bg-base-300 rounded-box w-52">
                  <li><button
                    onclick={onShareClick}
                    type="button"
                  >
                    <Icon name="link" />
                    Copy Page Link
                  </button></li>
                  <Show when={slugParts().bookSlug && allowBookCreate()}>
                    <li><button
                      onclick={onUpdateBookClick}
                      type="button"
                    >
                      <Icon name="folder" />
                      Notebook Settings
                    </button></li>
                  </Show>
                  <Show when={slugParts().bookSlug && slugParts().noteSlug && allowNoteCreate()}>
                    <li><button
                      onclick={onUpdateNoteClick}
                      type="button"
                    >
                      <Icon name="file" />
                      Note Settings
                    </button></li>
                    <li><button
                      onClick={onNoteAssetsClick}
                      type="button"
                    >
                      <Icon name="image" />
                      Note Assets
                    </button></li>
                  </Show>
                </ul>
              </details>
            </Show>
          </li>
        </menu>
        <NoteBreadcrumb class="flex-1" {...breadcrumb()} />
      </div>
      <Show when={!note.loading && !noteContent.loading} fallback={<LoadingRing />}>
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
          {note => <Note
            mode={noteMode()}
            setMode={(mode) => {
              if (mode === NoteMode.RENDERED) { setNoteModeSetting(null) }
              else { setNoteModeSetting(mode) }
            }}
            noteDetails={note()}
            content={noteContent}
            setContent={setNoteContent}
            isEditAllowed={allowNoteCreate() || false}
          />}
        </Show>
      </Show>
    </div>
  );
};

export default Shelf;
