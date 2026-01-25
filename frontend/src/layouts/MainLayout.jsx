import Nav from "../components/Nav"
import { Outlet } from "react-router-dom"

const MainLayout = () => {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  )
}

export default MainLayout
