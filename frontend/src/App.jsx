import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import { Layout } from './components/layout/Layout.jsx'
import { ArtifactCatalogPage } from './pages/ArtifactCatalogPage.jsx'
import { ArtifactDetailPage } from './pages/ArtifactDetailPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx'
import { AdminPage } from './pages/AdminPage.jsx'
import { UserPage } from './pages/UserPage.jsx'
import { FavoritesPage } from './pages/FavoritesPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { ROUTES } from './lib/constants.js'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ArtifactCatalogPage />} />
            <Route path="/artifact/:id" element={<ArtifactDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path={ROUTES.favorites} element={<FavoritesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
