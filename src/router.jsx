import {createBrowserRouter} from 'react-router-dom'
import { Layout } from './Layouts/ClientLayout'
import {Dashboard} from './Pages/Client/Dashboard'
import {Templates} from './Pages/Client/Templates'
import { TemplateDetail } from './Components/TemplateDetailView'
import {Orders} from './Pages/Client/Orders'
import {CreateBook} from './Pages/Client/CreateBook'
import { Books } from './Pages/Client/books'
import {Settings} from './Pages/Client/Settings'
import {Help} from './Pages/Client/Help'

export const Router=createBrowserRouter([
    {
        path:'/',
        element:<Layout />,
        children:[
            {
                path:"/home",
                element:<Dashboard />
            },
             {
                path:"/templates",
                element:<Templates />
            },
            {
                path:"/templates/:id",
                element:<TemplateDetail />
            },
            {
                path:'/orders',
                element:<Orders />
            },
            {
                path:'/create',
                element:<CreateBook />
            },
            {
                path:'/books',
                element:<Books />
            },
            {
                path:'/settings',
                element:<Settings />
            },
            {
                path:"/help",
                element:<Help />
            }


        ]
    }
])