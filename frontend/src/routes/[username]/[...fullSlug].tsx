import { useParams } from "@solidjs/router"

export default function Node() {
  const params = useParams<{
    username: string,
    fullSlug: string,
  }>()
  return (<></>)
}
