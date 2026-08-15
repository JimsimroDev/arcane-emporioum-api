package uk.jimsimrodev.arcanemporiumapi.infra.i18n;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ERarity;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class LabelController {

    private final MessageService messageService;

    public LabelController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/labels")
    public Map<String, String> labels(Locale locale) {
        Map<String, String> labels = new LinkedHashMap<>();

        labels.put("artifact.title", messageService.label("artifact.title", locale));
        labels.put("artifact.description", messageService.label("artifact.description", locale));
        labels.put("artifact.price", messageService.label("artifact.price", locale));
        labels.put("artifact.requiredLevel", messageService.label("artifact.requiredLevel", locale));
        labels.put("artifact.inStock", messageService.label("artifact.inStock", locale));
        labels.put("artifact.category", messageService.label("artifact.category", locale));
        labels.put("artifact.rarity", messageService.label("artifact.rarity", locale));
        labels.put("artifact.notfound", messageService.label("artifact.notfound", locale));

        labels.put("nav.catalog", messageService.label("nav.catalog", locale));
        labels.put("nav.login", messageService.label("nav.login", locale));
        labels.put("nav.logout", messageService.label("nav.logout", locale));
        labels.put("nav.admin", messageService.label("nav.admin", locale));
        labels.put("nav.favorites", messageService.label("nav.favorites", locale));
        labels.put("favorites.title", messageService.label("favorites.title", locale));
        labels.put("favorites.empty", messageService.label("favorites.empty", locale));
        labels.put("favorites.toggle", messageService.label("favorites.toggle", locale));
        labels.put("language.es", messageService.label("language.es", locale));
        labels.put("language.en", messageService.label("language.en", locale));
        labels.put("language.pt", messageService.label("language.pt", locale));
        labels.put("language.switcher", messageService.label("language.switcher", locale));
        labels.put("hero.title", messageService.label("hero.title", locale));
        labels.put("hero.subtitle", messageService.label("hero.subtitle", locale));
        labels.put("catalog.loading", messageService.label("catalog.loading", locale));
        labels.put("catalog.error", messageService.label("catalog.error", locale));
        labels.put("catalog.retry", messageService.label("catalog.retry", locale));
        labels.put("catalog.allCategories", messageService.label("catalog.allCategories", locale));
        labels.put("catalog.empty", messageService.label("catalog.empty", locale));
        labels.put("artifact.viewDetails", messageService.label("artifact.viewDetails", locale));
        labels.put("artifact.available", messageService.label("artifact.available", locale));
        labels.put("artifact.outOfStock", messageService.label("artifact.outOfStock", locale));
        labels.put("artifact.back", messageService.label("artifact.back", locale));
        labels.put("artifact.notfound.message", messageService.label("artifact.notfound.message", locale));
        labels.put("backToCatalog", messageService.label("backToCatalog", locale));
        labels.put("login.title", messageService.label("login.title", locale));
        labels.put("login.subtitle", messageService.label("login.subtitle", locale));
        labels.put("login.username", messageService.label("login.username", locale));
        labels.put("login.password", messageService.label("login.password", locale));
        labels.put("login.submit", messageService.label("login.submit", locale));
        labels.put("login.demoHints", messageService.label("login.demoHints", locale));
        labels.put("login.error", messageService.label("login.error", locale));
        labels.put("role.label", messageService.label("role.label", locale));
        labels.put("role.admin", messageService.label("role.admin", locale));
        labels.put("role.user", messageService.label("role.user", locale));
        labels.put("admin.title", messageService.label("admin.title", locale));
        labels.put("admin.granted", messageService.label("admin.granted", locale));
        labels.put("user.title", messageService.label("user.title", locale));
        labels.put("user.granted", messageService.label("user.granted", locale));
        labels.put("changePassword.title", messageService.label("changePassword.title", locale));
        labels.put("changePassword.current", messageService.label("changePassword.current", locale));
        labels.put("changePassword.newPassword", messageService.label("changePassword.newPassword", locale));
        labels.put("changePassword.confirmPassword", messageService.label("changePassword.confirmPassword", locale));
        labels.put("changePassword.submit", messageService.label("changePassword.submit", locale));
        labels.put("changePassword.success", messageService.label("changePassword.success", locale));
        labels.put("changePassword.mismatch", messageService.label("changePassword.mismatch", locale));
        labels.put("changePassword.error", messageService.label("changePassword.error", locale));
        labels.put("notFound.title", messageService.label("notFound.title", locale));
        labels.put("notFound.message", messageService.label("notFound.message", locale));
        labels.put("notFound.back", messageService.label("notFound.back", locale));
        labels.put("footer.tagline", messageService.label("footer.tagline", locale));
        labels.put("footer.rights", messageService.label("footer.rights", locale));
        labels.put("error.generic", messageService.label("error.generic", locale));
        labels.put("catalog.search", messageService.label("catalog.search", locale));
        labels.put("login.forgotPassword", messageService.label("login.forgotPassword", locale));
        labels.put("forgotPassword.title", messageService.label("forgotPassword.title", locale));
        labels.put("forgotPassword.subtitle", messageService.label("forgotPassword.subtitle", locale));
        labels.put("forgotPassword.email", messageService.label("forgotPassword.email", locale));
        labels.put("forgotPassword.submit", messageService.label("forgotPassword.submit", locale));
        labels.put("forgotPassword.success", messageService.label("forgotPassword.success", locale));
        labels.put("forgotPassword.back", messageService.label("forgotPassword.back", locale));
        labels.put("resetPassword.title", messageService.label("resetPassword.title", locale));
        labels.put("resetPassword.subtitle", messageService.label("resetPassword.subtitle", locale));
        labels.put("resetPassword.newPassword", messageService.label("resetPassword.newPassword", locale));
        labels.put("resetPassword.confirmPassword", messageService.label("resetPassword.confirmPassword", locale));
        labels.put("resetPassword.submit", messageService.label("resetPassword.submit", locale));
        labels.put("resetPassword.success", messageService.label("resetPassword.success", locale));
        labels.put("resetPassword.invalidLink", messageService.label("resetPassword.invalidLink", locale));
        labels.put("resetPassword.passwordMismatch", messageService.label("resetPassword.passwordMismatch", locale));
        labels.put("resetPassword.back", messageService.label("resetPassword.back", locale));
        labels.put("user.role.ADMIN", messageService.label("user.role.ADMIN", locale));
        labels.put("user.role.USER", messageService.label("user.role.USER", locale));

        labels.put("register.title", messageService.label("register.title", locale));
        labels.put("register.subtitle", messageService.label("register.subtitle", locale));
        labels.put("register.email", messageService.label("register.email", locale));
        labels.put("register.password", messageService.label("register.password", locale));
        labels.put("register.confirmPassword", messageService.label("register.confirmPassword", locale));
        labels.put("register.passwordMismatch", messageService.label("register.passwordMismatch", locale));
        labels.put("register.submit", messageService.label("register.submit", locale));
        labels.put("register.back", messageService.label("register.back", locale));
        labels.put("register.error", messageService.label("register.error", locale));
        labels.put("register.prompt", messageService.label("register.prompt", locale));
        labels.put("register.success", messageService.label("register.success", locale));
        labels.put("admin.usersTitle", messageService.label("admin.usersTitle", locale));
        labels.put("admin.id", messageService.label("admin.id", locale));
        labels.put("admin.email", messageService.label("admin.email", locale));
        labels.put("admin.role", messageService.label("admin.role", locale));
        labels.put("admin.updateRole", messageService.label("admin.updateRole", locale));
        labels.put("admin.loading", messageService.label("admin.loading", locale));
        labels.put("admin.emptyUsers", messageService.label("admin.emptyUsers", locale));
        labels.put("admin.roleUpdated", messageService.label("admin.roleUpdated", locale));
        labels.put("admin.confirmDemote", messageService.label("admin.confirmDemote", locale));
        labels.put("admin.cannotChangeOwnRole", messageService.label("admin.cannotChangeOwnRole", locale));
        labels.put("admin.actions", messageService.label("admin.actions", locale));
        labels.put("admin.deleteUser", messageService.label("admin.deleteUser", locale));
        labels.put("admin.confirmDelete", messageService.label("admin.confirmDelete", locale));
        labels.put("admin.userDeleted", messageService.label("admin.userDeleted", locale));
        labels.put("admin.cannotDeleteSelf", messageService.label("admin.cannotDeleteSelf", locale));

        for (ECategory category : ECategory.values()) {
            labels.put("artifact.category." + category.name().toLowerCase(),
                    messageService.label("artifact.category." + category.name().toLowerCase(), locale));
        }

        for (ERarity rarity : ERarity.values()) {
            labels.put("artifact.rarity." + rarity.name().toLowerCase(),
                    messageService.label("artifact.rarity." + rarity.name().toLowerCase(), locale));
        }
        return labels;
    }
}
