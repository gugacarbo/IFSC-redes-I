import { Input } from "@udp-iot/ui/components/input";
import type { AppConfig } from "../../types";

export function ConfigFields({
	config,
	onChange,
}: {
	config: AppConfig;
	onChange: (c: AppConfig) => void;
}) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div>
				<label
					htmlFor="config-user"
					className="block text-sm font-semibold mb-1"
				>
					Usuario
				</label>
				<Input
					type="text"
					value={config.user}
					onChange={(e) => onChange({ ...config, user: e.target.value })}
					id="config-user"
				/>
			</div>
			<div>
				<label
					htmlFor="config-pass"
					className="block text-sm font-semibold mb-1"
				>
					Senha
				</label>
				<Input
					type="password"
					value={config.pass}
					onChange={(e) => onChange({ ...config, pass: e.target.value })}
					id="config-pass"
				/>
			</div>
			<div>
				<label
					htmlFor="config-polling"
					className="block text-sm font-semibold mb-1"
				>
					Polling (ms)
				</label>
				<Input
					type="number"
					value={config.pollingMs}
					onChange={(e) =>
						onChange({
							...config,
							pollingMs: parseInt(e.target.value, 10) || 0,
						})
					}
					id="config-polling"
				/>
			</div>
		</div>
	);
}
