import { Component, Show, createEffect, createResource, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useParams } from '@solidjs/router';
import { Book, Breadcrumb, BreadcrumbWithNames, Note as NoteDetails } from '~/core/types';
import NoteBreadcrumb from '~/components/note/breadcrumb';
import { useModal } from '~/contexts/ModalProvider';
import NewBookModal from '~/components/modals/new_book';
import NewNoteModal from '~/components/modals/new_note';
import UpdateBookModal from '~/components/modals/edit_book';
import UpdateNoteModal from '~/components/modals/edit_note';
import { useDrawer } from '~/contexts/DrawerProvider';
import { LoadingRing } from '~/components/loading';
import { ToastType, apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import Api from '~/core/api';
import Icon from '~/components/icon';
import Note, { NoteMode } from '~/components/note';
import StorageHandler from '~/core/storage';
import AssetsModal from '~/components/modals/assets';
import { StringSource, copyToClipboard, download } from '~/core/helpers';
import PrintNoteModal from '~/components/modals/print_note';
import { EditorState } from '~/components/editor/editor';
import { Context } from '~/core/renderer';
import { useSession } from '~/contexts/SessionProvider';

const Shelf: Component = () => {
  const params = useParams()
  const { userInfo } = useSession()
  const { pushToast } = useToast()
  const { setModal, clearModal } = useModal()
  const drawer = useDrawer()
  const { currentUser, currentBook: book, currentNote: note } = drawer
  const [noteModeSetting, setNoteModeSetting] = StorageHandler.createSettingSignal("note_mode", false)

  const [lastModified, setLastModified] = createSignal(note()?.updatedAt)
  createEffect(() => {
    setLastModified(note()?.updatedAt)
  })

  const noteMode = () => {
    let stored = noteModeSetting() as NoteMode | null
    if ((stored === NoteMode.EDIT && !allowNoteCreate()) || stored === null) {
      return NoteMode.RENDERED
    }
    return stored
  }

  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const slugParts: () => Breadcrumb = () => {
    return {
      username: params.username,
      bookSlug: params.bookSlug,
      noteSlug: params.noteSlug,
    }
  }

  const allowBookCreate = () => {
    return userInfo()?.username === slugParts().username
  }

  const allowNoteCreate = () => {
    return userInfo() && (book() && userInfo()?.id === book()?.ownerId)
  }

  const [noteContent, { mutate: setNoteContent }] = createResource(note, async (note) => {
    try {
      let result = await Api.getNoteContentById(note.id)
      if (!result.endsWith("\n")) {
        result += "\n"
      }
      return result
    } catch (err) {
      pushToast(apiErrorIntoToast(err, "getting note content"))
    }
  })

  const globalLoading = () => noteContent.loading

  const breadcrumb: () => BreadcrumbWithNames = () => {
    return {
      username: params.username,
      fullName: currentUser()?.name,
      bookSlug: globalLoading() ? undefined : book()?.slug,
      bookName: globalLoading() ? undefined : book()?.name,
      noteSlug: globalLoading() ? undefined : note()?.slug,
      noteName: globalLoading() ? undefined : note()?.name,
    }
  }

  const onNewBookClick = () => {
    setModal({
      component: NewBookModal,
      props: {
        onClose: (newBook?: Book) => {
          if (newBook) drawer.updateBook(newBook)
          clearModal()
        }, user: userInfo()
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
        }, user: userInfo(), book: book()
      },
    })
  }

  const onUpdateBookClick = () => {
    setModal({
      component: UpdateBookModal,
      props: {
        onClose: (newBook?: Book) => {
          if (newBook) {
            drawer.updateBook(newBook)
          }
          clearModal()
        },
        onDeleteClose: (bookId: string) => {
          drawer.deleteBook(bookId)
          clearModal()
        },
        user: userInfo(),
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
            drawer.updateNote(newNote)
          }
          clearModal()
        },
        onDeleteClose: (noteId: string) => {
          drawer.deleteNote(noteId)
          clearModal()
        },
        user: userInfo(), book: book(), note: note(),
      },
    })
  }

  const onNoteAssetsClick = () => {
    setModal({
      component: AssetsModal,
      props: {
        onClose: clearModal,
        noteId: note()?.id,
        allowEdit: allowNoteCreate(),
      },
    })
  }

  const onShareClick = async () => {
    try {
      await copyToClipboard(location.href)
      pushToast({ message: "copied to clipboard", type: ToastType.SUCCESS })
    } catch (err) {
      pushToast({ message: err.message, type: ToastType.ERROR })
    }
  }

  const onNotePrintClick = async () => {
    setModal({
      component: PrintNoteModal,
      props: {
        onClose: clearModal,
        content: noteContent() || "",
        context: new Context(note()!.name, book()!.name),
      },
    })
  }

  const saveNote = async (noteId: string, content: string) => {
    setState({ saving: true })
    const currentlastModified = lastModified()
    try {
      let result = await Api.updateNoteContent(
        noteId,
        content,
        currentlastModified === undefined ? undefined : new Date(currentlastModified),
      )
      setLastModified(result.toISOString());
      setState({ unsaved: false })
      setNoteContent(content)
    } catch (err) {
      pushToast(apiErrorIntoToast(err, "saving note"))
    } finally {
      setState({ saving: false })
    }
  }

  return (
    <div class="flex flex-col gap-4 mt-6">
      <div class="flex gap-4 flex-col sm:flex-row">
        <menu class="menu menu-horizontal">
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
                <ul class="p-2 menu dropdown-content z-[1] w-52 backdrop-glass">
                  <li><button
                    onclick={(ev) => {
                      onShareClick()
                      ev.currentTarget.closest("details")?.removeAttribute("open")
                    }}
                    type="button"
                    classList={{ "hidden": !window.isSecureContext }}
                  >
                    <Icon name="link" />
                    Copy Page Link
                  </button></li>
                  <Show when={slugParts().bookSlug && allowBookCreate()}>
                    <li><button
                      onclick={(ev) => {
                        onUpdateBookClick()
                        ev.currentTarget.closest("details")?.removeAttribute("open")
                      }}
                      type="button"
                    >
                      <Icon name="folder" />
                      Notebook Settings
                    </button></li>
                  </Show>
                  <Show when={slugParts().bookSlug && slugParts().noteSlug && allowNoteCreate()}>
                    <li><button
                      onclick={(ev) => {
                        onUpdateNoteClick()
                        ev.currentTarget.closest("details")?.removeAttribute("open")
                      }}
                      type="button"
                    >
                      <Icon name="file" />
                      Note Settings
                    </button></li>
                    <li><button
                      onClick={(ev) => {
                        onNoteAssetsClick()
                        ev.currentTarget.closest("details")?.removeAttribute("open")
                      }}
                      type="button"
                    >
                      <Icon name="image" />
                      Note Assets
                    </button></li>
                  </Show>
                  <Show when={slugParts().bookSlug && slugParts().noteSlug}>
                    <li><button
                      onClick={(ev) => {
                        let content = noteContent()
                        if (content) {
                          download(
                            new StringSource(content, "text/markdown"),
                            `${book()?.slug}_${note()?.slug}.md`,
                          )
                        }
                        ev.currentTarget.closest("details")?.removeAttribute("open")
                      }}
                      type="button"
                      classList={{ "loading": noteContent.loading }}
                    >
                      <Icon name="download" />
                      Download Note
                    </button></li>
                    <li><button
                      onClick={(ev) => {
                        onNotePrintClick()
                        ev.currentTarget.closest("details")?.removeAttribute("open")
                      }}
                      type="button"
                    >
                      <Icon name="printer" />
                      Print Note
                    </button></li>
                  </Show>
                </ul>
              </details>
            </Show>
          </li>
        </menu>
        <NoteBreadcrumb class="flex-1" {...breadcrumb()} />
      </div>
      <Show when={!noteContent.loading} fallback={<LoadingRing />}>
        <Show when={note()} fallback={
          <div class="flex py-6">
            <div class="max-w-md mx-auto">
              <h1 class="text-5xl font-bold">No Note Selected</h1>
              <p class="py-6">Either create a new note or select an existing one.</p>
            </div>
          </div>
        }>
          {note => <Note
            mode={noteMode()}
            setMode={(mode) => {
              if (mode === NoteMode.RENDERED) { setNoteModeSetting(null) }
              else { setNoteModeSetting(mode) }
            }}
            content={() => noteContent() || ""}
            setContent={setNoteContent}
            context={() => new Context(note().name, book()!.name)}
            isEditAllowed={allowNoteCreate() || false}
            state={state}
            setState={setState}
            onSave={(content) => saveNote(note().id, content)}
          />}
        </Show>
      </Show>
    </div>
  );
};

export default Shelf;
