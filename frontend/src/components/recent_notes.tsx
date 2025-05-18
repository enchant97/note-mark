import { For, Suspense, createResource } from "solid-js"
import { A } from "@solidjs/router"
import { useApi } from "~/contexts/ApiProvider"
import { ApiError } from "~/core/api"
import { LoadingSpin } from "~/components/loading"

const RecentNotes = () => {
  const { api } = useApi()

  const [recentNotes] = createResource(api, async (api) => {
    let recentNotes = await api.getNotesRecents()
    if (recentNotes instanceof ApiError) {
      return []
    } else {
      return recentNotes
    }
  })

  return (
    <Suspense fallback={<LoadingSpin />}>
      <ul class="flex gap-2 flex-col items-center mt-2">
        <For each={recentNotes()}>
          {row => <li><A class="btn btn-wide" href={`/${row.slug}`}>{row.value.name}</A></li>}
        </For>
      </ul>
    </Suspense>
  );
}

export default RecentNotes
