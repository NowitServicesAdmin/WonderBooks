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
import { BookCreation } from './Components/BookCreation'

// Super Admin pages
import { SuperAdminDashboard } from './Pages/SuperAdmin/Dashboard'
import { SuperAdminUsers } from './Pages/SuperAdmin/Users'
import { SuperAdminBooks } from './Pages/SuperAdmin/Books'
import { SuperAdminOrders } from './Pages/SuperAdmin/Orders'
import {SuperAdminSubscriptions} from './Pages/SuperAdmin/Subscription'

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
            },
        ]
    },
    {
        path:'/bookcreation',
        element:<Layout header={false} />,
        children:[
            {
                path:'/bookcreation',
                element:<BookCreation />
            }
        ]
    },
    {
        path:'/superadmin',
        element:<Layout superadmin={true} />,
        children:[
            {
                path:'/superadmin',
                element:<SuperAdminDashboard />
            },
            {
                path:'/superadmin/users',
                element:<SuperAdminUsers />
            },
            {
                path:'/superadmin/books',
                element:<SuperAdminBooks />
            },
            {
                path:'/superadmin/orders',
                element:<SuperAdminOrders />
            },
            {
                path:'/superadmin/subscriptions',
                element:<SuperAdminSubscriptions />
            },
        ]
    }
])