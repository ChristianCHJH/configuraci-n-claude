# Plan: Validación Peso Bruto > Tara

## Contexto

Regla de negocio documentada en `docs/flujo-negocio-dt.html` (Sección 9, Regla 3):
> El Peso Bruto registrado jamás puede ser menor o igual a la Tara del contenedor vacío. `PesoBruto > Tara`.

Se aplica a dos pesos del movimiento:
- `pesoBrutoDeclaradoKg` — ingresado al crear o editar el movimiento
- `pesoBrutoVerificadoKg` — ingresado al registrar el EIR

La validación debe estar en **backend (autoritativa)** y en **frontend de creación (UX preventiva)**.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `backend/src/movimiento/movimiento.service.ts` | Validar en `create()`, `update()`, `registrarEir()` |
| `frontend/.../contenedores-detalle/contenedores-detalle.component.ts` | Validar `pesoBrutoDeclaradoKg > tara` antes de llamar API |

---

## Backend — `movimiento.service.ts`

### 1. Helper privado

Agregar helper reutilizable al final de la clase:

```typescript
private validarPesoBruto(pesoBrutoKg: number, taraKg: number, campo: string): void {
  if (pesoBrutoKg <= taraKg) {
    throw new BadRequestException(
      `${campo} (${pesoBrutoKg} kg) debe ser mayor que la tara del contenedor (${taraKg} kg)`,
    );
  }
}
```

Import a agregar: `BadRequestException` de `@nestjs/common`.

### 2. En `create(contenedorId, dto)`

El método ya carga el contenedor (para verificar que existe). Después de obtenerlo, agregar:

```typescript
if (dto.pesoBrutoDeclaradoKg != null) {
  this.validarPesoBruto(dto.pesoBrutoDeclaradoKg, contenedor.pesotaraKg, 'Peso bruto declarado');
}
```

### 3. En `update(movId, dto)`

El método carga el movimiento via `findOne()`. Agregar carga del contenedor y validación:

```typescript
if (dto.pesoBrutoDeclaradoKg != null) {
  const contenedor = await this.contenedorRepo.findOneByOrFail({ id: movimiento.contenedorId });
  this.validarPesoBruto(dto.pesoBrutoDeclaradoKg, contenedor.pesotaraKg, 'Peso bruto declarado');
}
```

**`contenedorRepo` NO está inyectado** — agregar en dos lugares:

`backend/src/movimiento/movimiento.module.ts`:
```typescript
// Agregar Contenedor a forFeature
TypeOrmModule.forFeature([MovimientoContenedor, Contenedor])
```
Import: `import { Contenedor } from '../contenedor/contenedor.entity.js';`

`movimiento.service.ts` constructor:
```typescript
@InjectRepository(Contenedor)
private readonly contenedorRepo: Repository<Contenedor>,
```

### 4. En `registrarEir(movId, dto)`

El método carga el movimiento via `findOne()`. Agregar:

```typescript
if (dto.pesoBrutoVerificadoKg != null) {
  const contenedor = await this.contenedorRepo.findOneByOrFail({ id: movimiento.contenedorId });
  this.validarPesoBruto(dto.pesoBrutoVerificadoKg, contenedor.pesotaraKg, 'Peso bruto verificado');
}
```

---

## Frontend — `contenedores-detalle.component.ts`

En `guardarMovimiento()`, antes de construir el DTO y llamar a la API:

```typescript
const pesoBruto = this.formMovimiento.value.pesoBrutoDeclaradoKg;
if (pesoBruto != null && this.contenedor && pesoBruto <= this.contenedor.pesotaraKg) {
  this.messageService.add({
    severity: 'warn',
    summary: 'Peso inválido',
    detail: `El peso bruto declarado (${pesoBruto} kg) debe ser mayor que la tara del contenedor (${this.contenedor.pesotaraKg} kg).`,
    life: 6000,
  });
  return;
}
```

Para EIR (`formEir` en `movimiento-detalle.component.ts`): el componente no tiene `pesotaraKg` del contenedor en contexto. El backend lanzará un 400 que el `ErrorInterceptor` mostrará como toast automáticamente. No se agrega validación frontend en el modal EIR.

---

## Verificación

1. Crear movimiento con `pesoBrutoDeclaradoKg` ≤ tara → toast de advertencia antes de llamar API, no se envía request
2. Crear movimiento con `pesoBrutoDeclaradoKg` > tara → se guarda correctamente
3. Editar movimiento (PATCH) con peso inválido → backend retorna 400, `ErrorInterceptor` muestra toast
4. Registrar EIR con `pesoBrutoVerificadoKg` ≤ tara → backend retorna 400, toast de error
5. Registrar EIR con peso válido → se guarda correctamente
6. Dejar `pesoBrutoDeclaradoKg` vacío → sin validación (campo opcional)
