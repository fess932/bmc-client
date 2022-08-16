import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import {
  RecoilRoot,
  selector,
  selectorFamily,
  useRecoilValue,
  waitForNone,
} from 'recoil'

function App() {
  return (
    <RecoilRoot>
      <AppBar position='static'>
        <Toolbar variant='dense'>BMC</Toolbar>
      </AppBar>
      <Container>
        <HackerNews />
      </Container>
    </RecoilRoot>
  )
}

export default App

const lastStoriesIDQuery = selector({
  key: 'lastStoriesIDQuery',
  get: async () => {
    const resp = await fetch(
      'https://hacker-news.firebaseio.com/v0/newstories.json'
    )

    let ids = await resp.json()
    if (ids.length === 0) {
      throw new Error('No stories found')
    }

    ids = ids.slice(0, 100)
    return ids
  },
})

const storyQuery = selectorFamily({
  key: 'storyQuery',
  get: (id) => async () => {
    const storyPath = `https://hacker-news.firebaseio.com/v0/item/${id}.json`
    try {
      const resp = await fetch(storyPath)
      const story = await resp.json()
      return story
    } catch (e) {
      console.log('error', e)
      throw e
    }
  },
})

const storiesQuery = selector({
  key: 'storiesQuery',
  get: ({ get }) => {
    const storyList = get(lastStoriesIDQuery)
    const storyLoadables = get(
      waitForNone(storyList.map((id) => storyQuery(id)))
    )

    return storyLoadables
  },
})

function HackerNews() {
  const storyLoadable = useRecoilValue(storiesQuery)

  return (
    <>
      <Typography variant='h4'>Истории</Typography>
      {storyLoadable.map((story, key) => LoadableStory(story, key))}
    </>
  )
}

function LoadableStory(story, key) {
  if (story.state === 'loading') {
    return <div key={key}>Loading...</div>
  }
  if (story.state === 'hasError') {
    return <div key={key}>Error</div>
  }

  return (
    <Typography key={key}>
      {story.contents.id} - {story.contents.title}
    </Typography>
  )
}
