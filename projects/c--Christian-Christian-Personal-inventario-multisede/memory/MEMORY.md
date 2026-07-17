# Memoria — venta-inventario

- [Auditoría: actualizacion nulable](auditoria-actualizacion-nulable.md) — usuario_actualizacion/fecha_actualizacion son NULL al crear; creacion sigue NOT NULL.
- [Variantes: talla exclusiva](variantes-talla-exclusiva.md) — un solo tipo de talla por producto; Color es lo único combinable, nunca talla × talla.
- [No perl/sed masivo](no-bulk-perl-sed-edits.md) — editar código con Edit tool o subagente, nunca perl/sed masivo sobre src/.
