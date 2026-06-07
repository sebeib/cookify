package me.eibisch.cookify.invite.service;

import io.quarkus.runtime.StartupEvent;
import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.util.UUID;
import me.eibisch.cookify.invite.domain.Invite;
import me.eibisch.cookify.invite.repository.InviteRepository;
import me.eibisch.cookify.role.RoleIds;
import me.eibisch.cookify.user.repository.UserRepository;
import org.jboss.logging.Logger;

@ApplicationScoped
@Startup
public class InitialAdminInviteInitializer {

    private static final Logger LOG = Logger.getLogger(InitialAdminInviteInitializer.class);

    private final InviteRepository inviteRepository;
    private final UserRepository userRepository;

    @Inject
    public InitialAdminInviteInitializer(InviteRepository inviteRepository, UserRepository userRepository) {
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
    }

    public void onStartup(@Observes StartupEvent startupEvent) {
        LOG.info("Checking whether an initial admin invite must be created.");

        if (inviteRepository.existsAny() || userRepository.existsAny()) {
            LOG.info("Skipping initial admin invite creation because invites or users already exist.");
            return;
        }

        Invite invite = new Invite(UUID.randomUUID(), RoleIds.ADMIN);
        inviteRepository.create(invite).ifPresentOrElse(
                createdInvite -> LOG.infof(
                        "Initial admin invite created. Token: %s",
                        createdInvite.id()),
                () -> LOG.error("The initial admin invite could not be created.")
        );
    }
}
