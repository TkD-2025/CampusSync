import { useContext } from 'react'
import { AppDataContext } from '../context/appDataContextObject'

export const useAppData = () => useContext(AppDataContext)
