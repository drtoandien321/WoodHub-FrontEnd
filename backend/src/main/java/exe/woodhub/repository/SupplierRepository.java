package exe.woodhub.repository;

import exe.woodhub.entity.Supplier;
import exe.woodhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    boolean existsByUser(User user);

    boolean existsByTaxCode(String taxCode);

    Optional<Supplier> findByUser(User user);
}
