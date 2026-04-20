import { compareAsc } from 'date-fns'

export const sortByDeadline = (tasks) =>
  [...tasks].sort((a, b) =>
    compareAsc(new Date(a.deadline || Date.now()), new Date(b.deadline || Date.now())),
  )
